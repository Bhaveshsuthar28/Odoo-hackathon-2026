import { FastifyPluginAsync } from 'fastify';
import { prisma, PaymentStatus, InvoiceStatus, PaymentMethod } from '@subflow/database';
import { Decimal } from 'decimal.js';
import { createAuditLog } from '../../utils/audit.js';

export const recoveryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireStaffOrAdmin);

  fastify.get('/', async (request, reply) => {
    const recoveries = await prisma.paymentRecovery.findMany({
      include: {
        customer: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const recoveredCount = recoveries.filter((r) => r.status === 'RECOVERED').length;
    const pendingCount = recoveries.filter((r) => r.status === 'PENDING' || r.status === 'RETRYING').length;

    const totalRecovered = recoveries
      .filter((r) => r.status === 'RECOVERED')
      .reduce((sum, r) => sum.plus(new Decimal(r.amount)), new Decimal(0));

    const totalAtRisk = recoveries
      .filter((r) => r.status !== 'RECOVERED')
      .reduce((sum, r) => sum.plus(new Decimal(r.amount)), new Decimal(0));

    return reply.send({
      success: true,
      data: {
        stats: {
          recoveredCount,
          pendingCount,
          totalRecovered: totalRecovered.toNumber(),
          totalAtRisk: totalAtRisk.toNumber(),
        },
        recoveries,
      },
    });
  });

  // Safe retry simulation
  fastify.post('/:id/retry', async (request, reply) => {
    const { id } = request.params as { id: string };

    const recovery = await prisma.paymentRecovery.findUnique({
      where: { id },
      include: { invoice: true, customer: true },
    });

    if (!recovery) {
      return reply.status(404).send({ success: false, message: 'Recovery record not found' });
    }

    if (recovery.status === 'RECOVERED') {
      return reply.status(400).send({ success: false, message: 'This payment has already been successfully recovered.' });
    }

    // Simulate recovery transaction
    const [updatedRecovery, payment, updatedInvoice] = await prisma.$transaction(async (tx) => {
      const payCount = await tx.payment.count();
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;

      // Create recovered payment record
      const p = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: recovery.invoiceId,
          customerId: recovery.customerId,
          paymentMethod: PaymentMethod.CARD,
          amount: recovery.amount,
          paymentDate: new Date(),
          reference: `RETRY_AUTO_REC_${Date.now()}`,
          note: 'Automated card retry successful via SubFlow Recovery Center',
          status: PaymentStatus.COMPLETED,
        },
      });

      // Update invoice
      const inv = await tx.invoice.update({
        where: { id: recovery.invoiceId },
        data: {
          amountPaid: { increment: recovery.amount },
          outstandingAmount: { decrement: recovery.amount },
          status: InvoiceStatus.PAID,
        },
      });

      // Update recovery record
      const rec = await tx.paymentRecovery.update({
        where: { id: recovery.id },
        data: {
          status: 'RECOVERED',
          retryCount: { increment: 1 },
          recoveredAt: new Date(),
          lastError: null,
        },
      });

      return [rec, p, inv];
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PAYMENT_RECOVERED',
      entity: 'PaymentRecovery',
      entityId: id,
      details: {
        recoveredAmount: recovery.amount,
        invoiceNumber: recovery.invoice.invoiceNumber,
        customer: recovery.customer.name,
      },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: `Payment of ₹${recovery.amount} recovered successfully! Invoice ${recovery.invoice.invoiceNumber} is marked PAID.`,
      data: {
        recovery: updatedRecovery,
        payment,
        invoice: updatedInvoice,
      },
    });
  });
};
