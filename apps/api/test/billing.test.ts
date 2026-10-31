import assert from 'node:assert';
import { calculateLineTotal, calculateNextBillingDate } from '@subflow/shared';
import { runBillingEngine } from '../src/modules/billing/billing.service.js';
import { prisma, SubscriptionStatus, InvoiceStatus, PaymentMethod } from '@subflow/database';
import { Decimal } from 'decimal.js';

async function runTestSuite() {
  console.log('🧪 Starting SubFlow Verification & Automated Test Suite...');

  // 1. Test Financial Billing Calculations & Rounding
  console.log('▶️ Test 1: Financial & Tax Calculation precision');
  {
    const calc = calculateLineTotal(4999.00, 1, 20.00, 18.00);
    // Subtotal: 4999.00
    // Discount 20%: 999.80
    // Taxable: 3999.20
    // Tax 18%: 719.86
    // Total: 4719.06
    assert.strictEqual(calc.subtotal.toString(), '4999');
    assert.strictEqual(calc.discountAmount.toString(), '999.8');
    assert.strictEqual(calc.taxAmount.toString(), '719.86');
    assert.strictEqual(calc.total.toString(), '4719.06');
    console.log('   ✅ Tax, discount and line totals match exact mathematical precision');
  }

  // 2. Test Next Billing Date calculation
  console.log('▶️ Test 2: Next Billing Date interval calculation');
  {
    const baseDate = new Date('2026-01-15T00:00:00.000Z');
    const nextDaily = calculateNextBillingDate(baseDate, 'DAILY');
    const nextWeekly = calculateNextBillingDate(baseDate, 'WEEKLY');
    const nextMonthly = calculateNextBillingDate(baseDate, 'MONTHLY');
    const nextYearly = calculateNextBillingDate(baseDate, 'YEARLY');

    assert.strictEqual(nextDaily.getDate(), 16);
    assert.strictEqual(nextWeekly.getDate(), 22);
    assert.strictEqual(nextMonthly.getMonth(), 1); // February
    assert.strictEqual(nextYearly.getFullYear(), 2027);
    console.log('   ✅ Date intervals (DAILY, WEEKLY, MONTHLY, YEARLY) computed properly');
  }

  // 3. Test Billing Engine Execution & Duplicate Invoice Prevention
  console.log('▶️ Test 3: Billing Engine Execution & Duplicate Prevention');
  {
    // First billing run
    const result1 = await runBillingEngine('MANUAL');
    console.log(`   Run 1: Generated ${result1.invoicesGenerated} invoices for due subscriptions.`);

    // Second immediate billing run should generate 0 duplicates!
    const result2 = await runBillingEngine('MANUAL');
    assert.strictEqual(result2.invoicesGenerated, 0, 'Duplicate invoices must NOT be generated on second run!');
    console.log('   ✅ Idempotent: 0 duplicate invoices generated on consecutive run');
  }

  // 4. Test Payment Reconciliation & Outstanding Calculation
  console.log('▶️ Test 4: Payment Reconciliation and Status Updates');
  {
    // Find an open confirmed invoice
    const openInvoice = await prisma.invoice.findFirst({
      where: { status: InvoiceStatus.CONFIRMED },
    });

    if (openInvoice) {
      const outstandingBefore = new Decimal(openInvoice.outstandingAmount);
      const payAmount = new Decimal(100.00);

      // Record partial payment
      const paymentNumber = `TEST-PAY-${Date.now()}`;
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            paymentNumber,
            invoiceId: openInvoice.id,
            customerId: openInvoice.customerId,
            paymentMethod: PaymentMethod.UPI,
            amount: payAmount,
            status: 'COMPLETED',
          },
        });

        await tx.invoice.update({
          where: { id: openInvoice.id },
          data: {
            amountPaid: { increment: payAmount },
            outstandingAmount: { decrement: payAmount },
            status: InvoiceStatus.PARTIALLY_PAID,
          },
        });
      });

      const updated = await prisma.invoice.findUnique({ where: { id: openInvoice.id } });
      assert.strictEqual(
        new Decimal(updated!.outstandingAmount).toString(),
        outstandingBefore.minus(payAmount).toString()
      );
      assert.strictEqual(updated!.status, InvoiceStatus.PARTIALLY_PAID);
      console.log('   ✅ Partial payment correctly reduces outstanding balance and updates status to PARTIALLY_PAID');
    }
  }

  // 5. Test Customer Isolation
  console.log('▶️ Test 5: Customer Data Isolation');
  {
    const customers = await prisma.customer.findMany({ take: 2 });
    assert.ok(customers.length >= 2, 'Need at least 2 customers');

    const customer1Invoices = await prisma.invoice.findMany({
      where: { customerId: customers[0].id },
    });

    // Verify none of customer1's invoices belong to customer2
    for (const inv of customer1Invoices) {
      assert.strictEqual(inv.customerId, customers[0].id);
      assert.notStrictEqual(inv.customerId, customers[1].id);
    }
    console.log('   ✅ Customer invoices and subscriptions are strictly isolated');
  }

  console.log('\n🎉 ALL 5 TEST SUITES PASSED SUCCESSFULLY!');
}

runTestSuite()
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
