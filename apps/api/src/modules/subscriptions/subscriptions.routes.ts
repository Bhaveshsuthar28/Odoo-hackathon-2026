import { FastifyPluginAsync } from 'fastify';
import { prisma, SubscriptionStatus, PlanInterval } from '@subflow/database';
import { subscriptionSchema, calculateLineTotal, calculateNextBillingDate } from '@subflow/shared';
import { Decimal } from 'decimal.js';
import { createAuditLog } from '../../utils/audit.js';

export const subscriptionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireStaffOrAdmin);

  // List subscriptions
  fastify.get('/', async (request, reply) => {
    const { status, customerId, planId, search } = request.query as any;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (planId) {
      where.planId = planId;
    }
    if (search) {
      where.OR = [
        { subscriptionNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        customer: true,
        plan: true,
        lines: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: { subscriptions } });
  });

  // Get subscription details
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
        lines: { include: { product: true, variant: true } },
        invoices: {
          include: { payments: true },
          orderBy: { invoiceDate: 'desc' },
        },
      },
    });

    if (!subscription) {
      return reply.status(404).send({ success: false, message: 'Subscription not found' });
    }

    return reply.send({ success: true, data: { subscription } });
  });

  // Create subscription directly
  fastify.post('/', async (request, reply) => {
    const parseResult = subscriptionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const data = parseResult.data;

    let subtotal = new Decimal(0);
    let discountAmount = new Decimal(0);
    let taxAmount = new Decimal(0);
    let grandTotal = new Decimal(0);

    const calculatedLines = data.lines.map((line) => {
      const calc = calculateLineTotal(line.unitPrice, line.quantity, line.discountPercent, line.taxPercent);
      subtotal = subtotal.plus(calc.subtotal);
      discountAmount = discountAmount.plus(calc.discountAmount);
      taxAmount = taxAmount.plus(calc.taxAmount);
      grandTotal = grandTotal.plus(calc.total);

      return {
        productId: line.productId,
        productVariantId: line.productVariantId || null,
        quantity: line.quantity,
        unitPrice: new Decimal(line.unitPrice),
        discountPercent: new Decimal(line.discountPercent),
        taxPercent: new Decimal(line.taxPercent),
        subtotal: calc.subtotal,
        total: calc.total,
      };
    });

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const nextBillingDate = calculateNextBillingDate(startDate, data.billingInterval as PlanInterval);

    const count = await prisma.subscription.count();
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const subscription = await prisma.subscription.create({
      data: {
        subscriptionNumber,
        customerId: data.customerId,
        planId: data.planId,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        nextBillingDate,
        billingInterval: data.billingInterval as PlanInterval,
        paymentTerms: data.paymentTerms,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount: grandTotal,
        autoRenew: data.autoRenew,
        lines: {
          create: calculatedLines,
        },
      },
      include: { customer: true, plan: true, lines: true },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'SUBSCRIPTION_CREATED',
      entity: 'Subscription',
      entityId: subscription.id,
      details: { subscriptionNumber, totalAmount: subscription.totalAmount },
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Subscription created successfully',
      data: { subscription },
    });
  });

  // Pause subscription
  fastify.post('/:id/pause', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason = 'Paused by administrator' } = (request.body as any) || {};

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.PAUSED,
        pauseReason: reason,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'SUBSCRIPTION_PAUSED',
      entity: 'Subscription',
      entityId: id,
      details: { reason },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Subscription paused successfully',
      data: { subscription },
    });
  });

  // Resume subscription
  fastify.post('/:id/resume', async (request, reply) => {
    const { id } = request.params as { id: string };

    const currentSub = await prisma.subscription.findUnique({ where: { id } });
    if (!currentSub) {
      return reply.status(404).send({ success: false, message: 'Subscription not found' });
    }

    // Set next billing date to now or future to align renewal
    const nextBillingDate = currentSub.nextBillingDate < new Date()
      ? calculateNextBillingDate(new Date(), currentSub.billingInterval)
      : currentSub.nextBillingDate;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        pauseReason: null,
        nextBillingDate,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'SUBSCRIPTION_RESUMED',
      entity: 'Subscription',
      entityId: id,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Subscription resumed successfully',
      data: { subscription },
    });
  });

  // Cancel subscription
  fastify.post('/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason = 'Cancelled by administrator' } = (request.body as any) || {};

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CLOSED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        autoRenew: false,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'SUBSCRIPTION_CANCELLED',
      entity: 'Subscription',
      entityId: id,
      details: { reason },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription },
    });
  });
};
