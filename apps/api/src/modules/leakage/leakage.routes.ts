import { FastifyPluginAsync } from 'fastify';
import { prisma, PaymentStatus, InvoiceStatus, SubscriptionStatus } from '@subflow/database';
import { Decimal } from 'decimal.js';

export const leakageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireStaffOrAdmin);

  fastify.get('/', async (request, reply) => {
    const now = new Date();
    const in14Days = new Date();
    in14Days.setDate(in14Days.getDate() + 14);

    // Run all leakage queries concurrently in parallel
    const [
      failedPayments,
      overdueInvoices,
      expiringSubscriptions,
      skippedBillingSubscriptions,
    ] = await Promise.all([
      // 1. Failed payments
      prisma.payment.findMany({
        where: { status: PaymentStatus.FAILED },
        include: { customer: true, invoice: true },
        orderBy: { paymentDate: 'desc' },
      }),

      // 2. Overdue invoices
      prisma.invoice.findMany({
        where: { status: InvoiceStatus.OVERDUE },
        include: { customer: true },
        orderBy: { dueDate: 'asc' },
      }),

      // 3. Expiring subscriptions without auto-renew
      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          autoRenew: false,
          expiryDate: { lte: in14Days, gte: now },
        },
        include: { customer: true, plan: true },
      }),

      // 4. Overdue/Skipped next billing dates
      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: { lt: now },
        },
        include: { customer: true, plan: true },
      }),
    ]);

    // Calculate revenue at risk (failed payment amounts + overdue invoice outstanding balances)
    const failedTotal = failedPayments.reduce((sum, p) => sum.plus(new Decimal(p.amount)), new Decimal(0));
    const overdueTotal = overdueInvoices.reduce((sum, i) => sum.plus(new Decimal(i.outstandingAmount)), new Decimal(0));
    const totalRevenueAtRisk = failedTotal.plus(overdueTotal);

    // Generate actionable recommendations
    const recommendations = [];
    if (failedPayments.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Failed Payments',
        title: `${failedPayments.length} failed payment transactions detected`,
        action: 'Trigger automatic card retries in the Recovery Center or send UPI payment links.',
        potentialRecovery: failedTotal.toNumber(),
      });
    }

    if (overdueInvoices.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Overdue Receivables',
        title: `₹${overdueTotal.toFixed(2)} pending in ${overdueInvoices.length} overdue invoices`,
        action: 'Send automated invoice reminder notices and enable automated dunning.',
        potentialRecovery: overdueTotal.toNumber(),
      });
    }

    if (expiringSubscriptions.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Subscription Churn Risk',
        title: `${expiringSubscriptions.length} subscriptions set to churn within 14 days`,
        action: 'Engage account managers to secure renewal contracts before expiration.',
        potentialRecovery: expiringSubscriptions.reduce((s, sub) => s + Number(sub.totalAmount), 0),
      });
    }

    if (skippedBillingSubscriptions.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Unbilled Subscriptions',
        title: `${skippedBillingSubscriptions.length} active subscriptions are overdue for billing`,
        action: 'Execute "Run Billing Now" to generate outstanding invoices immediately.',
        potentialRecovery: skippedBillingSubscriptions.reduce((s, sub) => s + Number(sub.totalAmount), 0),
      });
    }

    return reply.send({
      success: true,
      data: {
        summary: {
          totalRevenueAtRisk: totalRevenueAtRisk.toNumber(),
          failedPaymentsCount: failedPayments.length,
          overdueInvoicesCount: overdueInvoices.length,
          expiringSubscriptionsCount: expiringSubscriptions.length,
          skippedBillingCount: skippedBillingSubscriptions.length,
        },
        recommendations,
        failedPayments,
        overdueInvoices,
        expiringSubscriptions,
        skippedBillingSubscriptions,
      },
    });
  });
};
