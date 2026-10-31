import { FastifyPluginAsync } from 'fastify';
import { prisma, SubscriptionStatus } from '@subflow/database';
import { createAuditLog } from '../../utils/audit.js';

export const portalRoutes: FastifyPluginAsync = async (fastify) => {
  // All portal routes require authentication and enforce customer scoping
  fastify.addHook('preHandler', fastify.authenticate);

  // Helper to get authenticated customer record with strict tenant isolation
  async function getCustomerForUser(userId: string, customerIdFromToken?: string | null) {
    if (customerIdFromToken) {
      const c = await prisma.customer.findFirst({
        where: { id: customerIdFromToken, userId },
      });
      if (c) return c;
    }
    return prisma.customer.findFirst({
      where: { userId },
    });
  }

  // Get current customer profile
  fastify.get('/me', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(404).send({ success: false, message: 'Customer profile not found for this user account' });
    }

    return reply.send({ success: true, data: { customer } });
  });

  // Update permitted customer details
  fastify.put('/me', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(404).send({ success: false, message: 'Customer profile not found' });
    }

    const { phone, addressLine1, addressLine2, city, state, postalCode, country } = (request.body as any) || {};

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PORTAL_CUSTOMER_PROFILE_UPDATED',
      entity: 'Customer',
      entityId: customer.id,
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'Profile updated successfully', data: { customer: updated } });
  });

  // Get customer subscriptions
  fastify.get('/subscriptions', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.send({ success: true, data: { subscriptions: [] } });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { customerId: customer.id },
      include: {
        plan: true,
        lines: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: { subscriptions } });
  });

  // Get customer invoices
  fastify.get('/invoices', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.send({ success: true, data: { invoices: [] } });
    }

    const invoices = await prisma.invoice.findMany({
      where: { customerId: customer.id },
      include: {
        lines: true,
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return reply.send({ success: true, data: { invoices } });
  });

  // Get customer payment history
  fastify.get('/payments', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.send({ success: true, data: { payments: [] } });
    }

    const payments = await prisma.payment.findMany({
      where: { customerId: customer.id },
      include: {
        invoice: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return reply.send({ success: true, data: { payments } });
  });

  // Request subscription cancellation
  fastify.post('/subscriptions/:id/request-cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason = 'Customer self-service cancellation request' } = (request.body as any) || {};

    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(403).send({ success: false, message: 'Unauthorized' });
    }

    const sub = await prisma.subscription.findFirst({
      where: { id, customerId: customer.id },
    });

    if (!sub) {
      return reply.status(404).send({ success: false, message: 'Subscription not found or not owned by you' });
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        autoRenew: false,
        cancellationReason: `Self-Service Requested: ${reason}`,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PORTAL_SUBSCRIPTION_CANCEL_REQUESTED',
      entity: 'Subscription',
      entityId: sub.id,
      details: { reason },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Cancellation requested. Auto-renew has been disabled for this subscription.',
      data: { subscription: updated },
    });
  });

  // Pause subscription
  fastify.post('/subscriptions/:id/pause', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason = 'Paused by customer via portal' } = (request.body as any) || {};

    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(403).send({ success: false, message: 'Unauthorized' });
    }

    const sub = await prisma.subscription.findFirst({
      where: { id, customerId: customer.id },
    });

    if (!sub) {
      return reply.status(404).send({ success: false, message: 'Subscription not found' });
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.PAUSED,
        pauseReason: reason,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PORTAL_SUBSCRIPTION_PAUSED',
      entity: 'Subscription',
      entityId: sub.id,
      details: { reason },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Subscription has been paused.',
      data: { subscription: updated },
    });
  });

  // Resume subscription
  fastify.post('/subscriptions/:id/resume', async (request, reply) => {
    const { id } = request.params as { id: string };

    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(403).send({ success: false, message: 'Unauthorized' });
    }

    const sub = await prisma.subscription.findFirst({
      where: { id, customerId: customer.id },
    });

    if (!sub) {
      return reply.status(404).send({ success: false, message: 'Subscription not found' });
    }

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        pauseReason: null,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PORTAL_SUBSCRIPTION_RESUMED',
      entity: 'Subscription',
      entityId: sub.id,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Subscription has been resumed.',
      data: { subscription: updated },
    });
  });
};
