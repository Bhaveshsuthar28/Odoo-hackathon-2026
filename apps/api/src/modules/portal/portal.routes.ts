import { FastifyPluginAsync } from 'fastify';
import {
  prisma,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  PlanInterval,
  ProductType,
} from '@subflow/database';
import { Decimal } from 'decimal.js';
import { calculateNextBillingDate } from '@subflow/shared';
import { createAuditLog } from '../../utils/audit.js';
import { verifyPassword, hashPassword, validatePasswordPolicy } from '../../utils/security.js';

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

  // Invoice PDF endpoint alias for portal consumers
  fastify.get('/invoices/:id/pdf', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.redirect(307, `/api/invoices/${id}/pdf`);
  });

  // Pay an invoice directly from customer portal (Money Cart or external payment)
  fastify.post('/invoices/:id/pay', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { paymentMethod = 'WALLET', amount, note } = (request.body as any) || {};

    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(404).send({ success: false, message: 'Customer profile not found' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Exclusively lock invoice row
        await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${id} FOR UPDATE`;

        const invoice = await tx.invoice.findUnique({
          where: { id },
          include: { customer: true },
        });

        if (!invoice) {
          throw new Error('Invoice not found');
        }

        const isOwner =
          invoice.customerId === customer.id ||
          invoice.customer.userId === request.user.id ||
          (request.user.email && invoice.customer.email.toLowerCase() === request.user.email.toLowerCase());

        if (!isOwner) {
          throw new Error('Unauthorized to pay this invoice');
        }

        if (invoice.status === InvoiceStatus.PAID) {
          throw new Error('This invoice is already fully paid.');
        }

        if (invoice.status === InvoiceStatus.CANCELLED) {
          throw new Error('Cannot pay a cancelled invoice.');
        }

        const outstanding = new Decimal(invoice.outstandingAmount);
        const paymentAmount = amount ? new Decimal(amount) : outstanding;

        if (paymentAmount.lte(0)) {
          throw new Error('Payment amount must be greater than zero.');
        }

        if (paymentAmount.gt(outstanding)) {
          throw new Error(`Payment amount (₹${paymentAmount.toFixed(2)}) exceeds outstanding due (₹${outstanding.toFixed(2)}).`);
        }

        let updatedWalletBalance = new Decimal(customer.walletBalance);

        if (paymentMethod === 'WALLET') {
          await tx.$queryRaw`SELECT id, "walletBalance" FROM "Customer" WHERE id = ${customer.id} FOR UPDATE`;
          const currentCust = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
          const currentWallet = new Decimal(currentCust.walletBalance);

          if (paymentAmount.gt(currentWallet)) {
            throw new Error(`Insufficient Money Cart balance: Available ₹${currentWallet.toFixed(2)}, required ₹${paymentAmount.toFixed(2)}. Please add money to your cart first.`);
          }

          updatedWalletBalance = currentWallet.minus(paymentAmount);
          await tx.customer.update({
            where: { id: customer.id },
            data: { walletBalance: updatedWalletBalance },
          });

          await tx.walletTransaction.create({
            data: {
              customerId: customer.id,
              type: 'INVOICE_PAYMENT',
              amount: paymentAmount,
              balanceAfter: updatedWalletBalance,
              description: `Paid Invoice #${invoice.invoiceNumber} via Money Cart`,
              reference: `WAL-INV-${Date.now()}`,
            },
          });
        }

        const newPaid = new Decimal(invoice.amountPaid).plus(paymentAmount);
        const newOutstanding = new Decimal(invoice.totalAmount).minus(newPaid);
        let newStatus: InvoiceStatus = invoice.status;
        if (newOutstanding.lte(0)) {
          newStatus = InvoiceStatus.PAID;
        } else if (newPaid.gt(0)) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        }

        const payCount = await tx.payment.count();
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}-${randSuffix}`;

        const payment = await tx.payment.create({
          data: {
            paymentNumber,
            invoiceId: invoice.id,
            customerId: customer.id,
            paymentMethod: paymentMethod as PaymentMethod,
            amount: paymentAmount,
            paymentDate: new Date(),
            reference: `PORTAL-PAY-${Date.now()}`,
            note: note || (paymentMethod === 'WALLET' ? 'Paid via SubFlow Money Cart Wallet' : 'Customer Portal direct payment'),
            status: PaymentStatus.COMPLETED,
          },
        });

        const updatedInvoice = await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newPaid,
            outstandingAmount: newOutstanding,
            status: newStatus,
          },
        });

        return { payment, updatedInvoice, updatedWalletBalance };
      });

      await createAuditLog({
        actorId: request.user.id,
        actorEmail: request.user.email,
        actorRole: request.user.role,
        action: 'PORTAL_INVOICE_PAID',
        entity: 'Invoice',
        entityId: id,
        details: { amount: result.payment.amount, paymentMethod },
        ipAddress: request.ip,
      });

      return reply.send({
        success: true,
        message: `Successfully paid ₹${result.payment.amount} for Invoice #${result.updatedInvoice.invoiceNumber}!`,
        data: {
          payment: result.payment,
          invoice: result.updatedInvoice,
          walletBalance: result.updatedWalletBalance,
        },
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message || 'Payment processing failed',
      });
    }
  });

  // Get customer Money Cart (wallet balance and transactions)
  fastify.get('/wallet', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.send({ success: true, data: { walletBalance: 0, transactions: [] } });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send({
      success: true,
      data: {
        walletBalance: customer.walletBalance,
        transactions,
      },
    });
  });

  // Add money to Money Cart (Top-up)
  fastify.post('/wallet/topup', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(404).send({ success: false, message: 'Customer profile not found' });
    }

    const { amount, paymentMethod = 'CARD', reference } = (request.body as any) || {};
    const topupAmount = new Decimal(amount);

    if (!topupAmount.isFinite() || topupAmount.lte(0)) {
      return reply.status(400).send({ success: false, message: 'Top-up amount must be greater than zero.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Exclusively lock customer row
      await tx.$queryRaw`SELECT id, "walletBalance" FROM "Customer" WHERE id = ${customer.id} FOR UPDATE`;
      const currentCust = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
      const currentBalance = new Decimal(currentCust.walletBalance);
      const newBalance = currentBalance.plus(topupAmount);

      const updatedCust = await tx.customer.update({
        where: { id: customer.id },
        data: { walletBalance: newBalance },
      });

      const txRef = reference || `CART-TOP-${Date.now()}`;
      const walletTx = await tx.walletTransaction.create({
        data: {
          customerId: customer.id,
          type: 'TOPUP',
          amount: topupAmount,
          balanceAfter: newBalance,
          description: `Added ₹${topupAmount.toFixed(2)} to Money Cart via ${paymentMethod}`,
          reference: txRef,
        },
      });

      return { updatedCust, walletTx };
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PORTAL_WALLET_TOPUP',
      entity: 'Customer',
      entityId: customer.id,
      details: { amount: topupAmount.toNumber(), reference: result.walletTx.reference },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: `Successfully loaded ₹${topupAmount.toFixed(2)} into your Money Cart!`,
      data: {
        walletBalance: result.updatedCust.walletBalance,
        transaction: result.walletTx,
      },
    });
  });

  // Deduct Money Cart for extra server usage, on-demand compute, or storage
  fastify.post('/wallet/charge-usage', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(404).send({ success: false, message: 'Customer profile not found' });
    }

    const { amount, reason = 'Extra server load & compute spikes' } = (request.body as any) || {};
    const chargeAmount = new Decimal(amount);

    if (!chargeAmount.isFinite() || chargeAmount.lte(0)) {
      return reply.status(400).send({ success: false, message: 'Usage charge amount must be greater than zero.' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id, "walletBalance" FROM "Customer" WHERE id = ${customer.id} FOR UPDATE`;
        const currentCust = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
        const currentBalance = new Decimal(currentCust.walletBalance);

        if (chargeAmount.gt(currentBalance)) {
          throw new Error(`INSUFFICIENT_FUNDS: Available balance ₹${currentBalance.toFixed(2)}, required ₹${chargeAmount.toFixed(2)}`);
        }

        const newBalance = currentBalance.minus(chargeAmount);
        const updatedCust = await tx.customer.update({
          where: { id: customer.id },
          data: { walletBalance: newBalance },
        });

        const txRef = `USAGE-CHG-${Date.now()}`;
        const walletTx = await tx.walletTransaction.create({
          data: {
            customerId: customer.id,
            type: 'USAGE_CHARGE',
            amount: chargeAmount,
            balanceAfter: newBalance,
            description: reason,
            reference: txRef,
          },
        });

        return { updatedCust, walletTx };
      });

      await createAuditLog({
        actorId: request.user.id,
        actorEmail: request.user.email,
        actorRole: request.user.role,
        action: 'PORTAL_WALLET_USAGE_CHARGE',
        entity: 'Customer',
        entityId: customer.id,
        details: { amount: chargeAmount.toNumber(), reason },
        ipAddress: request.ip,
      });

      return reply.send({
        success: true,
        message: `Successfully deducted ₹${chargeAmount.toFixed(2)} from Money Cart for ${reason}`,
        data: {
          walletBalance: result.updatedCust.walletBalance,
          transaction: result.walletTx,
        },
      });
    } catch (err: any) {
      if (err.message?.startsWith('INSUFFICIENT_FUNDS')) {
        return reply.status(400).send({ success: false, message: err.message.replace('INSUFFICIENT_FUNDS: ', '') });
      }
      throw err;
    }
  });

  // Get active plans and products for customer marketplace
  fastify.get('/catalog', async (request, reply) => {
    const [plans, products] = await Promise.all([
      prisma.plan.findMany({
        where: { status: 'ACTIVE' },
        include: { product: true },
        orderBy: { price: 'asc' },
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: { variants: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return reply.send({
      success: true,
      data: { plans, products },
    });
  });

  // Activate a plan or product directly with payment (Card/UPI/NetBanking or Money Cart)
  fastify.post('/activate-service', async (request, reply) => {
    const customer = await getCustomerForUser(request.user.id, request.user.customerId);
    if (!customer) {
      return reply.status(404).send({ success: false, message: 'Customer profile not found' });
    }

    const { planId, productId, variantId, paymentMethod = 'WALLET', billingInterval = PlanInterval.MONTHLY } = (request.body as any) || {};

    if (!planId && !productId) {
      return reply.status(400).send({ success: false, message: 'Please specify either a planId or productId to activate.' });
    }

    try {
      if (planId) {
        const plan = await prisma.plan.findUnique({
          where: { id: planId },
          include: { product: true },
        });

        if (!plan || plan.status !== 'ACTIVE') {
          return reply.status(404).send({ success: false, message: 'Subscription plan not found or not currently active.' });
        }

        const price = new Decimal(plan.price);

        const activated = await prisma.$transaction(async (tx) => {
          let updatedBalance = new Decimal(customer.walletBalance);

          if (paymentMethod === 'WALLET') {
            await tx.$queryRaw`SELECT id, "walletBalance" FROM "Customer" WHERE id = ${customer.id} FOR UPDATE`;
            const currentCust = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
            const currentWallet = new Decimal(currentCust.walletBalance);

            if (price.gt(currentWallet)) {
              throw new Error(`INSUFFICIENT_WALLET_BALANCE: Available balance ₹${currentWallet.toFixed(2)}, required ₹${price.toFixed(2)}`);
            }

            updatedBalance = currentWallet.minus(price);
            await tx.customer.update({
              where: { id: customer.id },
              data: { walletBalance: updatedBalance },
            });

            const planDescription = plan.product?.name ? `${plan.name} (${plan.product.name})` : plan.name;
            await tx.walletTransaction.create({
              data: {
                customerId: customer.id,
                type: 'PURCHASE',
                amount: price,
                balanceAfter: updatedBalance,
                description: `Activated plan: ${planDescription}`,
                reference: `SRV-ACT-${Date.now()}`,
              },
            });
          }

          // Resolve valid productId for subscription line
          let targetProductId = plan.productId;
          if (!targetProductId) {
            const planItems = await tx.planItem.findMany({ where: { planId: plan.id } });
            if (planItems.length > 0) {
              targetProductId = planItems[0].productId;
            } else {
              const defaultProd = await tx.product.findFirst({ where: { status: 'ACTIVE' } });
              if (defaultProd) targetProductId = defaultProd.id;
            }
          }

          // Create Subscription with required subscriptionNumber and financial fields
          const now = new Date();
          const nextBilling = calculateNextBillingDate(now, plan.billingInterval as PlanInterval);

          const subCount = await tx.subscription.count();
          const randSuffix = Math.floor(1000 + Math.random() * 9000);
          const subscriptionNumber = `SUB-${now.getFullYear()}-${String(subCount + 1).padStart(4, '0')}-${randSuffix}`;

          const subscription = await tx.subscription.create({
            data: {
              subscriptionNumber,
              customerId: customer.id,
              planId: plan.id,
              status: SubscriptionStatus.ACTIVE,
              startDate: now,
              nextBillingDate: nextBilling,
              billingInterval: plan.billingInterval,
              paymentTerms: 'Due on Receipt',
              subtotal: price,
              discountAmount: 0,
              taxAmount: 0,
              totalAmount: price,
              autoRenew: true,
              lines: targetProductId
                ? {
                    create: [
                      {
                        productId: targetProductId,
                        quantity: 1,
                        unitPrice: price,
                        discountPercent: 0,
                        taxPercent: 18,
                        subtotal: price,
                        total: price,
                      },
                    ],
                  }
                : undefined,
            },
            include: { plan: true },
          });

          // Generate Invoice
          const invCount = await tx.invoice.count();
          const invoiceNumber = `INV-${now.getFullYear()}-${String(invCount + 1).padStart(4, '0')}-${randSuffix}`;

          const invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              customerId: customer.id,
              subscriptionId: subscription.id,
              invoiceDate: now,
              dueDate: now,
              billingPeriodStart: now,
              billingPeriodEnd: nextBilling,
              subtotal: price,
              discountAmount: 0,
              taxAmount: 0,
              totalAmount: price,
              amountPaid: price,
              outstandingAmount: 0,
              status: InvoiceStatus.PAID,
              notes: `Activated via Customer Portal using ${paymentMethod === 'WALLET' ? 'Money Cart' : paymentMethod}`,
              lines: {
                create: [
                  {
                    productId: targetProductId || undefined,
                    description: `Initial period activation: ${plan.name}`,
                    quantity: 1,
                    unitPrice: price,
                    discountPercent: 0,
                    taxPercent: 0,
                    subtotal: price,
                    total: price,
                  },
                ],
              },
            },
          });

          // Generate Payment
          const payCount = await tx.payment.count();
          const payNumber = `PAY-${now.getFullYear()}-${String(payCount + 1).padStart(4, '0')}-${randSuffix}`;

          const payment = await tx.payment.create({
            data: {
              paymentNumber: payNumber,
              invoiceId: invoice.id,
              customerId: customer.id,
              paymentMethod: paymentMethod as PaymentMethod,
              amount: price,
              paymentDate: now,
              reference: `ACT-PAY-${Date.now()}`,
              note: `Service activation payment via ${paymentMethod === 'WALLET' ? 'Money Cart' : paymentMethod}`,
              status: PaymentStatus.COMPLETED,
            },
          });

          return { subscription, invoice, payment, newBalance: updatedBalance };
        });

        await createAuditLog({
          actorId: request.user.id,
          actorEmail: request.user.email,
          actorRole: request.user.role,
          action: 'PORTAL_PLAN_ACTIVATED',
          entity: 'Subscription',
          entityId: activated.subscription.id,
          details: { planId: plan.id, planName: plan.name, paymentMethod },
          ipAddress: request.ip,
        });

        return reply.send({
          success: true,
          message: `Congratulations! ${plan.name} has been activated successfully.`,
          data: activated,
        });
      } else {
        // Direct product purchase
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { variants: true },
        });

        if (!product || product.status !== 'ACTIVE') {
          return reply.status(404).send({ success: false, message: 'Product not found or not active.' });
        }

        let price = new Decimal(product.basePrice || 0);
        let productName = product.name;

        if (variantId) {
          const variant = product.variants.find((v) => v.id === variantId);
          if (variant) {
            price = new Decimal(variant.price);
            productName = `${product.name} - ${variant.name}`;
          }
        }

        const activated = await prisma.$transaction(async (tx) => {
          let updatedBalance = new Decimal(customer.walletBalance);

          if (paymentMethod === 'WALLET') {
            await tx.$queryRaw`SELECT id, "walletBalance" FROM "Customer" WHERE id = ${customer.id} FOR UPDATE`;
            const currentCust = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
            const currentWallet = new Decimal(currentCust.walletBalance);

            if (price.gt(currentWallet)) {
              throw new Error(`INSUFFICIENT_WALLET_BALANCE: Available balance ₹${currentWallet.toFixed(2)}, required ₹${price.toFixed(2)}`);
            }

            updatedBalance = currentWallet.minus(price);
            await tx.customer.update({
              where: { id: customer.id },
              data: { walletBalance: updatedBalance },
            });

            await tx.walletTransaction.create({
              data: {
                customerId: customer.id,
                type: 'PURCHASE',
                amount: price,
                balanceAfter: updatedBalance,
                description: `Purchased service: ${productName}`,
                reference: `PROD-ACT-${Date.now()}`,
              },
            });
          }

          const now = new Date();
          const invCount = await tx.invoice.count();
          const randSuffix = Math.floor(1000 + Math.random() * 9000);
          const invoiceNumber = `INV-${now.getFullYear()}-${String(invCount + 1).padStart(4, '0')}-${randSuffix}`;

          const invoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              customerId: customer.id,
              invoiceDate: now,
              dueDate: now,
              billingPeriodStart: now,
              billingPeriodEnd: now,
              subtotal: price,
              discountAmount: 0,
              taxAmount: 0,
              totalAmount: price,
              amountPaid: price,
              outstandingAmount: 0,
              status: InvoiceStatus.PAID,
              notes: `Direct purchase via Customer Portal using ${paymentMethod === 'WALLET' ? 'Money Cart' : paymentMethod}`,
              lines: {
                create: [
                  {
                    productId: product.id,
                    description: productName,
                    quantity: 1,
                    unitPrice: price,
                    discountPercent: 0,
                    taxPercent: 0,
                    subtotal: price,
                    total: price,
                  },
                ],
              },
            },
          });

          const payCount = await tx.payment.count();
          const payNumber = `PAY-${now.getFullYear()}-${String(payCount + 1).padStart(4, '0')}-${randSuffix}`;

          const payment = await tx.payment.create({
            data: {
              paymentNumber: payNumber,
              invoiceId: invoice.id,
              customerId: customer.id,
              paymentMethod: paymentMethod as PaymentMethod,
              amount: price,
              paymentDate: now,
              reference: `PRD-PAY-${Date.now()}`,
              note: `Product purchase payment via ${paymentMethod === 'WALLET' ? 'Money Cart' : paymentMethod}`,
              status: PaymentStatus.COMPLETED,
            },
          });

          return { invoice, payment, newBalance: updatedBalance };
        });

        await createAuditLog({
          actorId: request.user.id,
          actorEmail: request.user.email,
          actorRole: request.user.role,
          action: 'PORTAL_PRODUCT_PURCHASED',
          entity: 'Product',
          entityId: product.id,
          details: { productName, paymentMethod, price: price.toNumber() },
          ipAddress: request.ip,
        });

        return reply.send({
          success: true,
          message: `Successfully purchased ${productName}!`,
          data: activated,
        });
      }
    } catch (err: any) {
      if (err.message?.startsWith('INSUFFICIENT_WALLET_BALANCE')) {
        return reply.status(400).send({
          success: false,
          message: err.message.replace('INSUFFICIENT_WALLET_BALANCE: ', ''),
        });
      }
      throw err;
    }
  });

  // Change password for customer user account
  fastify.post('/security/change-password', async (request, reply) => {
    const { currentPassword, newPassword } = (request.body as any) || {};

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({ success: false, message: 'Current and new password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
    });

    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return reply.status(400).send({ success: false, message: 'Current password is incorrect' });
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return reply.status(400).send({ success: false, message: policy.errors[0] || 'Password does not meet requirements' });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PORTAL_PASSWORD_CHANGED',
      entity: 'User',
      entityId: user.id,
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'Password updated successfully' });
  });
};
