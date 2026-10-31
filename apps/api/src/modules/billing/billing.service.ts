import { prisma, SubscriptionStatus, InvoiceStatus, PlanInterval } from '@subflow/database';
import { calculateLineTotal, calculateNextBillingDate } from '@subflow/shared';
import { Decimal } from 'decimal.js';

export interface BillingRunResult {
  executionId: string;
  trigger: 'SCHEDULED' | 'MANUAL';
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  subscriptionsProcessed: number;
  invoicesGenerated: number;
  totalAmountBilled: string;
  durationMs: number;
  errors: Array<{ subscriptionId: string; error: string }>;
  generatedInvoices: Array<{ invoiceId: string; invoiceNumber: string; amount: string; customer: string }>;
}

let isBillingEngineRunning = false;

export async function runBillingEngine(trigger: 'SCHEDULED' | 'MANUAL' = 'MANUAL'): Promise<BillingRunResult> {
  // Concurrency guard to prevent parallel overlapping billing runs
  if (isBillingEngineRunning) {
    throw new Error('A billing engine execution is already in progress. Please wait for it to complete.');
  }

  isBillingEngineRunning = true;
  const startTime = Date.now();
  const errors: Array<{ subscriptionId: string; error: string }> = [];
  const generatedInvoices: Array<{ invoiceId: string; invoiceNumber: string; amount: string; customer: string }> = [];
  let totalBilled = new Decimal(0);
  let processedCount = 0;

  try {
    const now = new Date();

    // 1. Find all active subscriptions due for billing (nextBillingDate <= now)
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: { lte: now },
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: { product: true },
        },
      },
      orderBy: { nextBillingDate: 'asc' },
    });

    processedCount = dueSubscriptions.length;

    for (const sub of dueSubscriptions) {
      try {
        // Compute billing period: from nextBillingDate (or now) to calculated next interval date
        const periodStart = new Date(sub.nextBillingDate);
        const periodEnd = calculateNextBillingDate(periodStart, sub.billingInterval as PlanInterval);

        // Guard against duplicate billing in the database
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            subscriptionId: sub.id,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
          },
        });

        if (existingInvoice) {
          // If invoice already exists for this period, simply advance subscription date if stuck
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { nextBillingDate: periodEnd },
          });
          continue;
        }

        // Calculate lines and totals with Decimal.js
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
            description: `${line.product.name} (${sub.billingInterval} subscription)`,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: line.discountPercent,
            taxPercent: line.taxPercent,
            subtotal: calc.subtotal,
            total: calc.total,
          };
        });

        // Set due date based on payment terms (e.g. Net 15, Net 30, or default 14 days)
        const dueDate = new Date(periodStart);
        if (sub.paymentTerms.toLowerCase().includes('30')) {
          dueDate.setDate(dueDate.getDate() + 30);
        } else if (sub.paymentTerms.toLowerCase().includes('15')) {
          dueDate.setDate(dueDate.getDate() + 15);
        } else {
          dueDate.setDate(dueDate.getDate() + 14);
        }

        // Atomic PostgreSQL transaction: Invoice creation + InvoiceLines + Subscription nextBillingDate advance
        await prisma.$transaction(async (tx) => {
          const invCount = await tx.invoice.count();
          const invoiceNumber = `INV-${now.getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;

          const invoice = await tx.invoice.create({
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
              notes: `Automated recurring billing for ${sub.plan.name} (${sub.subscriptionNumber})`,
              lines: {
                create: calculatedLines,
              },
            },
          });

          // Advance subscription next billing date
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              nextBillingDate: periodEnd,
            },
          });

          totalBilled = totalBilled.plus(invoiceTotal);
          generatedInvoices.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount.toString(),
            customer: sub.customer.name,
          });
        });
      } catch (err: any) {
        console.error(`Billing error for subscription ${sub.id}:`, err);
        errors.push({
          subscriptionId: sub.id,
          error: err.message || 'Unknown billing error',
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const executionStatus = errors.length === 0 ? 'COMPLETED' : (generatedInvoices.length > 0 ? 'PARTIAL' : 'FAILED');

    // Record Billing Execution History
    const executionRecord = await prisma.billingExecution.create({
      data: {
        trigger,
        status: executionStatus,
        subscriptionsProcessed: processedCount,
        invoicesGenerated: generatedInvoices.length,
        totalAmountBilled: totalBilled,
        errors: errors.length > 0 ? errors : undefined,
        durationMs,
      },
    });

    return {
      executionId: executionRecord.id,
      trigger,
      status: executionStatus,
      subscriptionsProcessed: processedCount,
      invoicesGenerated: generatedInvoices.length,
      totalAmountBilled: totalBilled.toFixed(2),
      durationMs,
      errors,
      generatedInvoices,
    };
  } finally {
    isBillingEngineRunning = false;
  }
}
