import { FastifyPluginAsync } from 'fastify';
import { prisma, DiscountType } from '@subflow/database';
import { discountSchema } from '@subflow/shared';
import { Decimal } from 'decimal.js';
import { createAuditLog } from '../../utils/audit.js';

export const discountRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ success: true, data: { discounts } });
  });

  fastify.post('/', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const parseResult = discountSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const data = parseResult.data;

    const discount = await prisma.discount.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        discountType: data.discountType as DiscountType,
        value: data.value,
        minPurchaseAmount: data.minPurchaseAmount,
        minQuantity: data.minQuantity,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        maxUsage: data.maxUsage,
        productId: data.productId,
        isSubscriptionWide: data.isSubscriptionWide,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'DISCOUNT_CREATED',
      entity: 'Discount',
      entityId: discount.id,
      details: { code: discount.code, value: discount.value, type: discount.discountType },
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Discount created successfully',
      data: { discount },
    });
  });

  // Validate discount code against an amount and check constraints
  fastify.post('/validate', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { code, amount = 0, quantity = 1 } = (request.body as any) || {};

    if (!code) {
      return reply.status(400).send({ success: false, message: 'Discount code is required' });
    }

    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount || !discount.isActive) {
      return reply.status(404).send({ success: false, message: 'Invalid or inactive discount code' });
    }

    const now = new Date();
    if (discount.startDate > now) {
      return reply.status(400).send({ success: false, message: 'Discount code is not active yet' });
    }

    if (discount.expiryDate && discount.expiryDate < now) {
      return reply.status(400).send({ success: false, message: 'Discount code has expired' });
    }

    if (discount.maxUsage && discount.usageCount >= discount.maxUsage) {
      return reply.status(400).send({ success: false, message: 'Discount code usage limit reached' });
    }

    const subtotal = new Decimal(amount);
    if (subtotal.lt(discount.minPurchaseAmount)) {
      return reply.status(400).send({
        success: false,
        message: `Minimum purchase amount of ₹${discount.minPurchaseAmount} required for this discount.`,
      });
    }

    let discountAmount = new Decimal(0);
    if (discount.discountType === 'PERCENTAGE') {
      discountAmount = subtotal.mul(new Decimal(discount.value).div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    } else {
      discountAmount = Decimal.min(new Decimal(discount.value), subtotal);
    }

    return reply.send({
      success: true,
      data: {
        code: discount.code,
        name: discount.name,
        discountType: discount.discountType,
        value: discount.value,
        discountAmount: discountAmount.toNumber(),
      },
    });
  });
};
