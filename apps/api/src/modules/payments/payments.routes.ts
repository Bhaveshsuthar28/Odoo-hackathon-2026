import { FastifyPluginAsync } from 'fastify';
import { prisma, InvoiceStatus, PaymentMethod, PaymentStatus } from '@subflow/database';
import { paymentSchema } from '@subflow/shared';
import { Decimal } from 'decimal.js';
import { createAuditLog } from '../../utils/audit.js';

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // List all payments
  fastify.get('/', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const { customerId, invoiceId, status } = request.query as any;

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (status && status !== 'ALL') where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true,
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return reply.send({ success: true, data: { payments } });
  });

  // Record a payment with atomic reconciliation
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parseResult = paymentSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const { invoiceId, amount, paymentMethod, reference, note } = parseResult.data;

    const paymentAmount = new Decimal(amount);
    if (!paymentAmount.isFinite() || paymentAmount.lte(0)) {
      return reply.status(400).send({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    try {
      // Execute payment and invoice reconciliation atomically inside a PostgreSQL transaction
      const [payment, updatedInvoice] = await prisma.$transaction(async (tx) => {
        // Exclusively lock the invoice row in PostgreSQL to prevent race conditions & balance over-allocation
        await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${invoiceId} FOR UPDATE`;

        // Fetch current invoice state inside the transaction to eliminate concurrency race conditions
        const currentInvoice = await tx.invoice.findUnique({
          where: { id: invoiceId },
          include: { customer: true },
        });

        if (!currentInvoice) {
          throw new Error('ERR_INVOICE_NOT_FOUND');
        }

        // Role check: if CUSTOMER, verify ownership strictly against current tenant record
        if (
          request.user.role === 'CUSTOMER' &&
          currentInvoice.customer.userId !== request.user.id &&
          currentInvoice.customerId !== request.user.customerId
        ) {
          throw new Error('ERR_FORBIDDEN');
        }

        if (currentInvoice.status === InvoiceStatus.PAID) {
          throw new Error('ERR_ALREADY_PAID');
        }

        if (currentInvoice.status === InvoiceStatus.CANCELLED) {
          throw new Error('ERR_INVOICE_CANCELLED');
        }

        const currentOutstanding = new Decimal(currentInvoice.outstandingAmount);
        if (paymentAmount.gt(currentOutstanding)) {
          throw new Error(`ERR_EXCEEDS_OUTSTANDING:${currentOutstanding}`);
        }

        const count = await tx.payment.count();
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}-${randSuffix}`;

        const newPaid = new Decimal(currentInvoice.amountPaid).plus(paymentAmount);
        const newOutstanding = new Decimal(currentInvoice.totalAmount).minus(newPaid);

        let newStatus: InvoiceStatus = currentInvoice.status;
        if (newOutstanding.lte(0)) {
          newStatus = InvoiceStatus.PAID;
        } else if (newPaid.gt(0)) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        }

        if (paymentMethod === 'WALLET') {
          // Lock customer record to prevent concurrent double-spending from wallet
          await tx.$queryRaw`SELECT id, "walletBalance" FROM "Customer" WHERE id = ${currentInvoice.customerId} FOR UPDATE`;
          const currentCustomer = await tx.customer.findUniqueOrThrow({ where: { id: currentInvoice.customerId } });
          const currentWallet = new Decimal(currentCustomer.walletBalance);
          if (paymentAmount.gt(currentWallet)) {
            throw new Error(`ERR_INSUFFICIENT_WALLET_BALANCE:Available ₹${currentWallet.toFixed(2)}, required ₹${paymentAmount.toFixed(2)}`);
          }
          const updatedBalance = currentWallet.minus(paymentAmount);
          await tx.customer.update({
            where: { id: currentInvoice.customerId },
            data: { walletBalance: updatedBalance },
          });
          await tx.walletTransaction.create({
            data: {
              customerId: currentInvoice.customerId,
              type: 'INVOICE_PAYMENT',
              amount: paymentAmount,
              balanceAfter: updatedBalance,
              description: `Paid Invoice #${currentInvoice.invoiceNumber} via Money Cart`,
              reference: reference || `WAL-PAY-${Date.now()}`,
            },
          });
        }

        const p = await tx.payment.create({
          data: {
            paymentNumber,
            invoiceId: currentInvoice.id,
            customerId: currentInvoice.customerId,
            paymentMethod: paymentMethod as PaymentMethod,
            amount: paymentAmount,
            paymentDate: new Date(),
            reference: reference || `REF-${Date.now()}`,
            note: note || (paymentMethod === 'WALLET' ? 'Paid via SubFlow Money Cart Wallet' : undefined),
            status: PaymentStatus.COMPLETED,
          },
        });

        const inv = await tx.invoice.update({
          where: { id: currentInvoice.id },
          data: {
            amountPaid: newPaid,
            outstandingAmount: newOutstanding,
            status: newStatus,
          },
        });

        return [p, inv];
      });

      await createAuditLog({
        actorId: request.user.id,
        actorEmail: request.user.email,
        actorRole: request.user.role,
        action: 'PAYMENT_RECORDED',
        entity: 'Payment',
        entityId: payment.id,
        details: {
          paymentNumber: payment.paymentNumber,
          invoiceNumber: updatedInvoice.invoiceNumber,
          amount: payment.amount,
          newInvoiceStatus: updatedInvoice.status,
        },
        ipAddress: request.ip,
      });

      return reply.status(201).send({
        success: true,
        message: `Payment of ₹${paymentAmount} recorded. Invoice status is now ${updatedInvoice.status}.`,
        data: {
          payment,
          invoice: updatedInvoice,
        },
      });
    } catch (err: any) {
      if (err.message === 'ERR_INVOICE_NOT_FOUND') {
        return reply.status(404).send({ success: false, message: 'Invoice not found' });
      }
      if (err.message === 'ERR_FORBIDDEN') {
        return reply.status(403).send({ success: false, message: 'Access denied: You do not own this invoice' });
      }
      if (err.message === 'ERR_ALREADY_PAID') {
        return reply.status(400).send({ success: false, message: 'This invoice is already fully paid.' });
      }
      if (err.message === 'ERR_INVOICE_CANCELLED') {
        return reply.status(400).send({ success: false, message: 'Cannot record payment for a cancelled invoice.' });
      }
      if (err.message?.startsWith('ERR_INSUFFICIENT_WALLET_BALANCE:')) {
        const msg = err.message.replace('ERR_INSUFFICIENT_WALLET_BALANCE:', '');
        return reply.status(400).send({
          success: false,
          message: `Insufficient Money Cart balance: ${msg}. Please add money to your wallet.`,
        });
      }
      if (err.message?.startsWith('ERR_EXCEEDS_OUTSTANDING:')) {
        const bal = err.message.split(':')[1];
        return reply.status(400).send({
          success: false,
          message: `Payment amount (₹${paymentAmount}) cannot exceed outstanding balance (₹${bal}).`,
        });
      }
      throw err;
    }
  });
};
