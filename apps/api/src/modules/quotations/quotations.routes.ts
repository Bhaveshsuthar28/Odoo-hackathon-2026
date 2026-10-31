import { FastifyPluginAsync } from 'fastify';
import { prisma, QuotationStatus, SubscriptionStatus, PlanInterval } from '@subflow/database';
import { quotationSchema, calculateLineTotal, calculateNextBillingDate } from '@subflow/shared';
import { Decimal } from 'decimal.js';
import { createAuditLog } from '../../utils/audit.js';

export const quotationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireStaffOrAdmin);

  // List quotations
  fastify.get('/', async (request, reply) => {
    const { status, customerId } = request.query as any;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        lines: { include: { product: true, variant: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: { quotations } });
  });

  // Get quotation details
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: { include: { product: true, variant: true } },
        convertedSubscription: true,
      },
    });

    if (!quotation) {
      return reply.status(404).send({ success: false, message: 'Quotation not found' });
    }

    return reply.send({ success: true, data: { quotation } });
  });

  // Create quotation
  fastify.post('/', async (request, reply) => {
    const parseResult = quotationSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const data = parseResult.data;

    // Recalculate financial totals on the backend using Decimal.js
    let totalSubtotal = new Decimal(0);
    let totalDiscount = new Decimal(0);
    let totalTax = new Decimal(0);
    let grandTotal = new Decimal(0);

    const calculatedLines = data.lines.map((line) => {
      const calc = calculateLineTotal(line.unitPrice, line.quantity, line.discountPercent, line.taxPercent);
      totalSubtotal = totalSubtotal.plus(calc.subtotal);
      totalDiscount = totalDiscount.plus(calc.discountAmount);
      totalTax = totalTax.plus(calc.taxAmount);
      grandTotal = grandTotal.plus(calc.total);

      return {
        productId: line.productId,
        productVariantId: line.productVariantId || null,
        description: line.description || '',
        quantity: line.quantity,
        unitPrice: new Decimal(line.unitPrice),
        discountPercent: new Decimal(line.discountPercent),
        taxPercent: new Decimal(line.taxPercent),
        subtotal: calc.subtotal,
        total: calc.total,
      };
    });

    const count = await prisma.quotation.count();
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + data.validityDays);

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: data.customerId,
        status: QuotationStatus.DRAFT,
        validityDate,
        subtotal: totalSubtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        totalAmount: grandTotal,
        termsAndConditions: data.termsAndConditions,
        notes: data.notes,
        createdById: request.user.id,
        lines: {
          create: calculatedLines,
        },
      },
      include: { customer: true, lines: true },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'QUOTATION_CREATED',
      entity: 'Quotation',
      entityId: quotation.id,
      details: { quotationNumber, totalAmount: quotation.totalAmount },
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Quotation created successfully',
      data: { quotation },
    });
  });

  // Convert Quotation into an Active Subscription atomically
  fastify.post('/:id/convert', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { planId: overridePlanId, billingInterval = 'MONTHLY' } = (request.body as any) || {};

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        lines: { include: { product: true } },
      },
    });

    if (!quotation) {
      return reply.status(404).send({ success: false, message: 'Quotation not found' });
    }

    // Guard: prevent duplicate subscription creation
    if (quotation.convertedSubscriptionId || quotation.status === QuotationStatus.CONVERTED) {
      return reply.status(400).send({
        success: false,
        message: 'This quotation has already been converted into a subscription to avoid duplication.',
      });
    }

    // Pick plan: either passed in body or default first active plan matching interval
    let selectedPlanId = overridePlanId;
    if (!selectedPlanId) {
      const defaultPlan = await prisma.plan.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (!defaultPlan) {
        return reply.status(400).send({
          success: false,
          message: 'No active plan available to associate with this converted subscription.',
        });
      }
      selectedPlanId = defaultPlan.id;
    }

    const interval = (billingInterval as PlanInterval) || PlanInterval.MONTHLY;
    const startDate = new Date();
    const nextBillingDate = calculateNextBillingDate(startDate, interval);

    const subCount = await prisma.subscription.count();
    const subscriptionNumber = `SUB-${new Date().getFullYear()}-${String(subCount + 1).padStart(4, '0')}`;

    // Execute atomic conversion inside a PostgreSQL transaction
    const [subscription, updatedQuotation] = await prisma.$transaction(async (tx) => {
      const newSub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          planId: selectedPlanId,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          nextBillingDate,
          billingInterval: interval,
          paymentTerms: 'Due on Receipt',
          subtotal: quotation.subtotal,
          discountAmount: quotation.discountAmount,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          autoRenew: true,
          lines: {
            create: quotation.lines.map((line) => ({
              productId: line.productId,
              productVariantId: line.productVariantId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discountPercent: line.discountPercent,
              taxPercent: line.taxPercent,
              subtotal: line.subtotal,
              total: line.total,
            })),
          },
        },
        include: { lines: true, plan: true, customer: true },
      });

      const updatedQuote = await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: QuotationStatus.CONVERTED,
          convertedSubscriptionId: newSub.id,
        },
      });

      return [newSub, updatedQuote];
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'QUOTATION_CONVERTED_TO_SUBSCRIPTION',
      entity: 'Quotation',
      entityId: quotation.id,
      details: {
        quotationNumber: quotation.quotationNumber,
        subscriptionNumber: subscription.subscriptionNumber,
        subscriptionId: subscription.id,
      },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Quotation successfully converted to active subscription',
      data: {
        subscription,
        quotation: updatedQuotation,
      },
    });
  });
};
