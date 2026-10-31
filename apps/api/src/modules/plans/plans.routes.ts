import { FastifyPluginAsync } from 'fastify';
import { prisma, PlanStatus } from '@subflow/database';
import { planSchema } from '@subflow/shared';
import { createAuditLog } from '../../utils/audit.js';

export const planRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const { status, interval } = request.query as any;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (interval && interval !== 'ALL') {
      where.billingInterval = interval;
    }

    const plans = await prisma.plan.findMany({
      where,
      include: {
        product: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: { plans } });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        product: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        subscriptions: {
          take: 10,
          include: { customer: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!plan) {
      return reply.status(404).send({ success: false, message: 'Plan not found' });
    }

    return reply.send({ success: true, data: { plan } });
  });

  fastify.post('/', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const parseResult = planSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const data = parseResult.data;

    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        billingInterval: data.billingInterval,
        price: data.price,
        currency: data.currency,
        minQuantity: data.minQuantity,
        autoClose: data.autoClose,
        status: data.status,
        productId: data.productId,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: { product: true },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PLAN_CREATED',
      entity: 'Plan',
      entityId: plan.id,
      details: { name: plan.name, code: plan.code, interval: plan.billingInterval, price: plan.price },
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Plan created successfully',
      data: { plan },
    });
  });

  fastify.put('/:id', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = planSchema.partial().safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const data = parseResult.data;

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: { product: true },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PLAN_UPDATED',
      entity: 'Plan',
      entityId: plan.id,
      details: data,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Plan updated successfully',
      data: { plan },
    });
  });

  fastify.post('/:id/pause', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const plan = await prisma.plan.update({
      where: { id },
      data: { status: PlanStatus.PAUSED },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PLAN_PAUSED',
      entity: 'Plan',
      entityId: id,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Plan paused successfully',
      data: { plan },
    });
  });

  fastify.post('/:id/resume', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const plan = await prisma.plan.update({
      where: { id },
      data: { status: PlanStatus.ACTIVE },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PLAN_RESUMED',
      entity: 'Plan',
      entityId: id,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Plan resumed successfully',
      data: { plan },
    });
  });
};
