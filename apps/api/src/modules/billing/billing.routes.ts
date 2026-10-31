import { FastifyPluginAsync } from 'fastify';
import { prisma, SubscriptionStatus } from '@subflow/database';
import { runBillingEngine } from './billing.service.js';
import { createAuditLog } from '../../utils/audit.js';

export const billingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireStaffOrAdmin);

  // Trigger manual billing run: "Run Billing Now"
  fastify.post('/run', async (request, reply) => {
    try {
      const result = await runBillingEngine('MANUAL');

      await createAuditLog({
        actorId: request.user.id,
        actorEmail: request.user.email,
        actorRole: request.user.role,
        action: 'BILLING_ENGINE_EXECUTED',
        entity: 'BillingExecution',
        entityId: result.executionId,
        details: {
          subscriptionsProcessed: result.subscriptionsProcessed,
          invoicesGenerated: result.invoicesGenerated,
          totalAmountBilled: result.totalAmountBilled,
          status: result.status,
        },
        ipAddress: request.ip,
      });

      return reply.send({
        success: true,
        message: `Billing completed: ${result.invoicesGenerated} invoices generated, ₹${result.totalAmountBilled} billed.`,
        data: result,
      });
    } catch (error: any) {
      return reply.status(409).send({
        success: false,
        message: error.message || 'Billing execution failed',
      });
    }
  });

  // Get Billing execution history
  fastify.get('/history', async (request, reply) => {
    const history = await prisma.billingExecution.findMany({
      orderBy: { executedAt: 'desc' },
      take: 50,
    });

    return reply.send({ success: true, data: { history } });
  });

  // Preview due subscriptions
  fastify.get('/due', async (request, reply) => {
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: { lte: new Date() },
      },
      include: {
        customer: true,
        plan: true,
      },
      orderBy: { nextBillingDate: 'asc' },
    });

    return reply.send({
      success: true,
      data: {
        count: dueSubscriptions.length,
        subscriptions: dueSubscriptions,
      },
    });
  });
};
