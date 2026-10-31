import { FastifyPluginAsync } from 'fastify';
import { prisma } from '@subflow/database';
import { Decimal } from 'decimal.js';

export const simulatorRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/simulate', async (request, reply) => {
    const { subscriptionId, targetPlanId, discountCode } = (request.body as any) || {};

    if (!subscriptionId || !targetPlanId) {
      return reply.status(400).send({ success: false, message: 'subscriptionId and targetPlanId are required' });
    }

    const [subscription, targetPlan] = await Promise.all([
      prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true, customer: true },
      }),
      prisma.plan.findUnique({
        where: { id: targetPlanId },
      }),
    ]);

    if (!subscription) {
      return reply.status(404).send({ success: false, message: 'Subscription not found' });
    }
    if (!targetPlan) {
      return reply.status(404).send({ success: false, message: 'Target plan not found' });
    }

    const now = new Date();
    const nextBilling = new Date(subscription.nextBillingDate);
    const msRemaining = Math.max(0, nextBilling.getTime() - now.getTime());
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const totalCycleDays = subscription.billingInterval === 'YEARLY' ? 365 : (subscription.billingInterval === 'WEEKLY' ? 7 : 30);

    // Current daily rate & unused credit
    const currentPrice = new Decimal(subscription.totalAmount);
    const dailyCreditRate = currentPrice.div(totalCycleDays);
    const unusedCredit = dailyCreditRate.mul(daysRemaining).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Target plan new charge
    const newPrice = new Decimal(targetPlan.price);
    const newDailyRate = newPrice.div(totalCycleDays);
    const proratedNewCharge = newDailyRate.mul(daysRemaining).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Proration difference
    const netDifference = proratedNewCharge.minus(unusedCredit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Check discount
    let discountAmount = new Decimal(0);
    if (discountCode) {
      const disc = await prisma.discount.findUnique({ where: { code: discountCode.toUpperCase() } });
      if (disc && disc.isActive) {
        if (disc.discountType === 'PERCENTAGE') {
          discountAmount = proratedNewCharge.mul(new Decimal(disc.value).div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        } else {
          discountAmount = Decimal.min(new Decimal(disc.value), proratedNewCharge);
        }
      }
    }

    // Applicable tax (18% GST)
    const taxableAmount = Decimal.max(0, netDifference.minus(discountAmount));
    const taxAmount = taxableAmount.mul(0.18).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const immediateDueAmount = taxableAmount.plus(taxAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return reply.send({
      success: true,
      data: {
        simulation: {
          currentPlan: {
            id: subscription.plan.id,
            name: subscription.plan.name,
            price: subscription.plan.price,
            interval: subscription.billingInterval,
          },
          targetPlan: {
            id: targetPlan.id,
            name: targetPlan.name,
            price: targetPlan.price,
            interval: targetPlan.billingInterval,
          },
          billingCycle: {
            nextBillingDate: subscription.nextBillingDate,
            daysRemaining,
            totalCycleDays,
          },
          financials: {
            unusedCredit: unusedCredit.toNumber(),
            proratedNewCharge: proratedNewCharge.toNumber(),
            netDifference: netDifference.toNumber(),
            discountAmount: discountAmount.toNumber(),
            taxAmount: taxAmount.toNumber(),
            immediateDueAmount: immediateDueAmount.toNumber(),
            subsequentRenewalPrice: newPrice.mul(1.18).toDecimalPlaces(2).toNumber(), // with 18% GST
          },
        },
      },
    });
  });
};
