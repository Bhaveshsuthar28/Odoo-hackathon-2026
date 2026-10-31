import { FastifyPluginAsync } from 'fastify';
import { prisma, SubscriptionStatus, InvoiceStatus, PaymentStatus } from '@subflow/database';
import { Decimal } from 'decimal.js';

export const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/metrics', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Run all KPI aggregates and chart queries concurrently in parallel for minimum latency
    const [
      activeSubscriptionsCount,
      totalCustomersCount,
      activeSubscriptions,
      completedPayments,
      invoices,
      overdueInvoices,
      upcomingRenewals,
      recentPayments,
      recentSubscriptions,
      paymentsForTrends,
      plansWithSubs,
      subStatuses,
    ] = await Promise.all([
      // 1. Active subscriptions count
      prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),

      // 2. Total active customers count
      prisma.customer.count({
        where: { status: { not: 'ARCHIVED' } },
      }),

      // 3. Active subscriptions for MRR / ARR calculation
      prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        select: {
          totalAmount: true,
          billingInterval: true,
        },
      }),

      // 4. Revenue collected (completed payments)
      prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),

      // 5. Outstanding invoice balances
      prisma.invoice.aggregate({
        where: {
          status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        },
        _sum: {
          totalAmount: true,
          amountPaid: true,
          outstandingAmount: true,
        },
      }),

      // 6. Overdue invoices
      prisma.invoice.findMany({
        where: { status: InvoiceStatus.OVERDUE },
        include: { customer: true },
        orderBy: { dueDate: 'asc' },
      }),

      // 7. Upcoming renewals in next 30 days
      prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: { gte: now, lte: in30Days },
        },
        include: { customer: true, plan: true },
        orderBy: { nextBillingDate: 'asc' },
      }),

      // 8. Recent transactions
      prisma.payment.findMany({
        take: 6,
        include: { customer: true, invoice: true },
        orderBy: { paymentDate: 'desc' },
      }),

      // 9. Recent subscriptions
      prisma.subscription.findMany({
        take: 6,
        include: { customer: true, plan: true },
        orderBy: { createdAt: 'desc' },
      }),

      // 10. Date-bounded payments for revenue trends (last 6 months)
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          paymentDate: { gte: sixMonthsAgo },
        },
        select: { amount: true, paymentDate: true },
      }),

      // 11. Plans with subscriptions
      prisma.plan.findMany({
        include: {
          subscriptions: {
            where: { status: SubscriptionStatus.ACTIVE },
            select: { totalAmount: true },
          },
        },
      }),

      // 12. Subscription Status breakdown
      prisma.subscription.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    // MRR calculation: Normalize each subscription to its monthly equivalent value
    let mrr = new Decimal(0);
    for (const sub of activeSubscriptions) {
      const amount = new Decimal(sub.totalAmount);
      switch (sub.billingInterval) {
        case 'DAILY':
          mrr = mrr.plus(amount.mul(30));
          break;
        case 'WEEKLY':
          mrr = mrr.plus(amount.mul(4.33));
          break;
        case 'MONTHLY':
          mrr = mrr.plus(amount);
          break;
        case 'YEARLY':
          mrr = mrr.plus(amount.div(12));
          break;
      }
    }
    const arr = mrr.mul(12);

    const revenueCollected = new Decimal(completedPayments._sum.amount || 0);
    const outstandingAmount = new Decimal(invoices._sum.outstandingAmount || 0);

    const overdueCount = overdueInvoices.length;
    const overdueTotal = overdueInvoices.reduce(
      (acc, inv) => acc.plus(new Decimal(inv.outstandingAmount)),
      new Decimal(0)
    );

    // 2. Chart data: Monthly revenue trend
    const monthlyTrendMap: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Pre-populate last 6 calendar months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyTrendMap[key] = 0;
    }

    for (const p of paymentsForTrends) {
      const d = new Date(p.paymentDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (monthlyTrendMap[key] !== undefined) {
        monthlyTrendMap[key] += Number(p.amount);
      }
    }

    const revenueTrendData = Object.entries(monthlyTrendMap).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue),
    }));

    // 3. Chart data: Revenue by Plan
    const revenueByPlan = plansWithSubs.map((p) => {
      const total = p.subscriptions.reduce((sum, s) => sum.plus(new Decimal(s.totalAmount)), new Decimal(0));
      return {
        name: p.name,
        value: Math.round(total.toNumber()),
      };
    });

    // 4. Chart data: Subscription Status breakdown
    const subscriptionStatusData = subStatuses.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    return reply.send({
      success: true,
      data: {
        kpis: {
          activeSubscriptions: activeSubscriptionsCount,
          totalCustomers: totalCustomersCount,
          mrr: Math.round(mrr.toNumber()),
          arr: Math.round(arr.toNumber()),
          revenueCollected: Math.round(revenueCollected.toNumber()),
          outstandingAmount: Math.round(outstandingAmount.toNumber()),
          overdueInvoicesCount: overdueCount,
          overdueInvoicesTotal: Math.round(overdueTotal.toNumber()),
          upcomingRenewalsCount: upcomingRenewals.length,
        },
        charts: {
          revenueTrend: revenueTrendData,
          revenueByPlan,
          subscriptionStatus: subscriptionStatusData,
        },
        upcomingRenewals: upcomingRenewals.slice(0, 5),
        overdueInvoices: overdueInvoices.slice(0, 5),
        recentTransactions: recentPayments,
        recentSubscriptions,
      },
    });
  });
};
