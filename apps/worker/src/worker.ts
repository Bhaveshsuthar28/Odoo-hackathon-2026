import cron from 'node-cron';
import { prisma, SubscriptionStatus, InvoiceStatus, PlanInterval } from '@subflow/database';
import { calculateLineTotal, calculateNextBillingDate } from '@subflow/shared';
import { Decimal } from 'decimal.js';

let isWorkerExecutionRunning = false;

async function executeScheduledBilling() {
  if (isWorkerExecutionRunning) {
    console.log('⏳ Scheduled billing already running. Skipping overlapping cycle.');
    return;
  }

  isWorkerExecutionRunning = true;
  const startTime = Date.now();
  console.log(`⏰ [${new Date().toISOString()}] Scheduled Billing Worker triggered.`);

  const errors: any[] = [];
  let generatedCount = 0;
  let totalBilled = new Decimal(0);

  try {
    const now = new Date();
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: { lte: now },
      },
      include: {
        customer: true,
        plan: true,
        lines: { include: { product: true } },
      },
    });

    console.log(`Found ${dueSubscriptions.length} subscriptions eligible for scheduled billing.`);

    for (const sub of dueSubscriptions) {
      try {
        const periodStart = new Date(sub.nextBillingDate);
        const periodEnd = calculateNextBillingDate(periodStart, sub.billingInterval as PlanInterval);

        // Check idempotency constraint
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            subscriptionId: sub.id,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
          },
        });

        if (existingInvoice) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { nextBillingDate: periodEnd },
          });
          continue;
        }

        let subtotal = new Decimal(0);
        let discountTotal = new Decimal(0);
        let taxTotal = new Decimal(0);
        let invoiceTotal = new Decimal(0);

        const calculatedLines = sub.lines.map((line) => {
          const calc = calculateLineTotal(line.unitPrice, line.quantity, line.discountPercent, line.taxPercent);
          subtotal = subtotal.plus(calc.subtotal);
          discountTotal = discountTotal.plus(calc.discountAmount);
          taxTotal = taxTotal.plus(calc.taxAmount);
          invoiceTotal = invoiceTotal.plus(calc.total);

          return {
            productId: line.productId,
            description: `${line.product.name} (${sub.billingInterval})`,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: line.discountPercent,
            taxPercent: line.taxPercent,
            subtotal: calc.subtotal,
            total: calc.total,
          };
        });

        const dueDate = new Date(periodStart);
        dueDate.setDate(dueDate.getDate() + 14);

        await prisma.$transaction(async (tx) => {
          const invCount = await tx.invoice.count();
          const invoiceNumber = `INV-${now.getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;

          await tx.invoice.create({
            data: {
              invoiceNumber,
              customerId: sub.customerId,
              subscriptionId: sub.id,
              billingPeriodStart: periodStart,
              billingPeriodEnd: periodEnd,
              invoiceDate: periodStart,
              dueDate,
              subtotal,
              discountAmount: discountTotal,
              taxAmount: taxTotal,
              totalAmount: invoiceTotal,
              amountPaid: 0.00,
              outstandingAmount: invoiceTotal,
              status: InvoiceStatus.CONFIRMED,
              notes: `Automated recurring billing worker for ${sub.plan.name}`,
              lines: {
                create: calculatedLines,
              },
            },
          });

          await tx.subscription.update({
            where: { id: sub.id },
            data: { nextBillingDate: periodEnd },
          });

          generatedCount++;
          totalBilled = totalBilled.plus(invoiceTotal);
        });
      } catch (err: any) {
        console.error(`Error processing subscription ${sub.id}:`, err);
        errors.push({ subscriptionId: sub.id, error: err.message });
      }
    }

    const durationMs = Date.now() - startTime;
    await prisma.billingExecution.create({
      data: {
        trigger: 'SCHEDULED',
        status: errors.length === 0 ? 'COMPLETED' : 'PARTIAL',
        subscriptionsProcessed: dueSubscriptions.length,
        invoicesGenerated: generatedCount,
        totalAmountBilled: totalBilled,
        errors: errors.length > 0 ? errors : undefined,
        durationMs,
      },
    });

    console.log(`✅ Scheduled billing run finished in ${durationMs}ms. Generated ${generatedCount} invoices (₹${totalBilled.toFixed(2)}).`);
  } catch (error) {
    console.error('Fatal scheduled billing error:', error);
  } finally {
    isWorkerExecutionRunning = false;
  }
}

// Read cron schedule from environment or default to hourly check
const cronSchedule = process.env.BILLING_CRON_SCHEDULE || '0 * * * *';

console.log(`🤖 SubFlow Autonomous Billing Worker initialized with schedule: "${cronSchedule}"`);
// Execute initial run immediately on startup
executeScheduledBilling();

// Schedule recurring cron
cron.schedule(cronSchedule, () => {
  executeScheduledBilling();
});
