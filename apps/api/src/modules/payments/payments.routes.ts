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

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return reply.status(404).send({ success: false, message: 'Invoice not found' });
    }

    // Role check: if CUSTOMER, must be the owner
    if (request.user.role === 'CUSTOMER' && invoice.customer.userId !== request.user.id && invoice.customerId !== request.user.customerId) {
      return reply.status(403).send({ success: false, message: 'Access denied' });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return reply.status(400).send({ success: false, message: 'This invoice is already fully paid.' });
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return reply.status(400).send({ success: false, message: 'Cannot record payment for a cancelled invoice.' });
    }

    const paymentAmount = new Decimal(amount);
    const currentOutstanding = new Decimal(invoice.outstandingAmount);

    if (paymentAmount.gt(currentOutstanding)) {
      return reply.status(400).send({
        success: false,
        message: `Payment amount (₹${paymentAmount}) cannot exceed outstanding balance (₹${currentOutstanding}).`,
      });
    }

    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Execute payment and invoice reconciliation inside a PostgreSQL transaction
    const [payment, updatedInvoice] = await prisma.$transaction(async (tx) => {
      const newPaid = new Decimal(invoice.amountPaid).plus(paymentAmount);
      const newOutstanding = new Decimal(invoice.totalAmount).minus(newPaid);

      let newStatus: InvoiceStatus = invoice.status;
      if (newOutstanding.lte(0)) {
        newStatus = InvoiceStatus.PAID;
      } else if (newPaid.gt(0)) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }

      const p = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          paymentMethod: paymentMethod as PaymentMethod,
          amount: paymentAmount,
          paymentDate: new Date(),
          reference: reference || `REF-${Date.now()}`,
          note,
          status: PaymentStatus.COMPLETED,
        },
      });

      const inv = await tx.invoice.update({
        where: { id: invoice.id },
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
        invoiceNumber: invoice.invoiceNumber,
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
  });
};
