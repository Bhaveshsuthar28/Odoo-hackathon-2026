import { FastifyPluginAsync } from 'fastify';
import { prisma, PaymentStatus, InvoiceStatus, SubscriptionStatus } from '@subflow/database';
import { Decimal } from 'decimal.js';

export const aiAssistantRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireStaffOrAdmin);

  fastify.post('/ask', async (request, reply) => {
    const { question } = (request.body as any) || {};

    if (!question || typeof question !== 'string') {
      return reply.status(400).send({ success: false, message: 'Question string is required' });
    }

    const q = question.toLowerCase();

    // 1. Revenue this month / collected
    if (q.includes('revenue') && (q.includes('month') || q.includes('collected') || q.includes('total'))) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const payments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          paymentDate: { gte: startOfMonth },
        },
        include: { customer: true },
      });

      const totalThisMonth = payments.reduce((sum, p) => sum.plus(new Decimal(p.amount)), new Decimal(0));
      const allTimePayments = await prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      });

      return reply.send({
        success: true,
        data: {
          intent: 'REVENUE_ANALYSIS',
          answer: `This month, SubFlow has recorded ₹${totalThisMonth.toFixed(2)} in collected revenue across ${payments.length} successful transactions. All-time recorded revenue stands at ₹${new Decimal(allTimePayments._sum.amount || 0).toFixed(2)}.`,
          details: {
            thisMonthTotal: totalThisMonth.toNumber(),
            transactionCount: payments.length,
            recentReceipts: payments.slice(0, 5).map((p) => ({
              number: p.paymentNumber,
              customer: p.customer.name,
              amount: Number(p.amount),
              date: p.paymentDate,
            })),
          },
        },
      });
    }

    // 2. Highest outstanding balances
    if (q.includes('highest') || q.includes('outstanding') || q.includes('balance') || q.includes('owe')) {
      const topDebtors = await prisma.invoice.groupBy({
        by: ['customerId'],
        where: {
          status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        },
        _sum: { outstandingAmount: true },
        orderBy: { _sum: { outstandingAmount: 'desc' } },
        take: 5,
      });

      const debtorDetails = await Promise.all(
        topDebtors.map(async (d) => {
          const cust = await prisma.customer.findUnique({ where: { id: d.customerId } });
          return {
            customerName: cust?.name || 'Unknown',
            company: cust?.company || 'N/A',
            outstandingAmount: Number(d._sum.outstandingAmount || 0),
          };
        })
      );

      return reply.send({
        success: true,
        data: {
          intent: 'OUTSTANDING_BALANCES',
          answer: `Here are the top accounts with open or overdue balances:\n${debtorDetails.map((d, i) => `${i + 1}. ${d.customerName} (${d.company}): ₹${d.outstandingAmount.toFixed(2)}`).join('\n')}`,
          details: debtorDetails,
        },
      });
    }

    // 3. Subscriptions expiring / renewals
    if (q.includes('expir') || q.includes('renew')) {
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);

      const expiring = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          OR: [
            { expiryDate: { gte: now, lte: in30Days } },
            { nextBillingDate: { gte: now, lte: in30Days } },
          ],
        },
        include: { customer: true, plan: true },
        orderBy: { nextBillingDate: 'asc' },
        take: 10,
      });

      return reply.send({
        success: true,
        data: {
          intent: 'EXPIRING_SUBSCRIPTIONS',
          answer: `There are ${expiring.length} active subscriptions with upcoming renewals or expirations in the next 30 days.`,
          details: expiring.map((s) => ({
            subscriptionNumber: s.subscriptionNumber,
            customer: s.customer.name,
            plan: s.plan.name,
            nextBillingDate: s.nextBillingDate,
            totalAmount: Number(s.totalAmount),
          })),
        },
      });
    }

    // 4. Overdue invoices above threshold (e.g. ₹5,000)
    if (q.includes('overdue')) {
      const overdue = await prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.OVERDUE,
          outstandingAmount: { gte: 5000 },
        },
        include: { customer: true },
        orderBy: { outstandingAmount: 'desc' },
      });

      const totalOverdue = overdue.reduce((sum, inv) => sum.plus(new Decimal(inv.outstandingAmount)), new Decimal(0));

      return reply.send({
        success: true,
        data: {
          intent: 'OVERDUE_INVOICES',
          answer: `Found ${overdue.length} overdue invoices with balances exceeding ₹5,000, representing a total of ₹${totalOverdue.toFixed(2)} in overdue receivables.`,
          details: overdue.map((i) => ({
            invoiceNumber: i.invoiceNumber,
            customer: i.customer.name,
            outstandingAmount: Number(i.outstandingAmount),
            dueDate: i.dueDate,
          })),
        },
      });
    }

    // 5. Why did MRR decrease / change
    if (q.includes('mrr') || q.includes('churn') || q.includes('decrease')) {
      const cancelledCount = await prisma.subscription.count({
        where: { status: SubscriptionStatus.CLOSED },
      });
      const pausedCount = await prisma.subscription.count({
        where: { status: SubscriptionStatus.PAUSED },
      });
      const activeCount = await prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      });

      return reply.send({
        success: true,
        data: {
          intent: 'MRR_ANALYSIS',
          answer: `Current MRR trajectory shows ${activeCount} active subscriptions, ${pausedCount} paused subscriptions, and ${cancelledCount} closed/churned subscriptions. Paused subscriptions do not accrue MRR until resumed.`,
          details: {
            activeCount,
            pausedCount,
            cancelledCount,
          },
        },
      });
    }

    // General fallback
    return reply.send({
      success: true,
      data: {
        intent: 'GENERAL_ASSISTANT',
        answer: `I can analyze your live PostgreSQL financial metrics. You can ask me:\n• "How much revenue did we collect this month?"\n• "Which customers have the highest outstanding balances?"\n• "Show overdue invoices above ₹5,000"\n• "Which subscriptions expire this month?"\n• "Why did our MRR decrease?"`,
      },
    });
  });
};
