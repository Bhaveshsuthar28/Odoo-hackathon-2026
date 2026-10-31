import assert from 'node:assert';
import { buildApp } from '../src/app.js';
import { prisma, Role, InvoiceStatus, SubscriptionStatus, QuotationStatus, PaymentMethod } from '@subflow/database';
import { Decimal } from 'decimal.js';

interface TestSummary {
  name: string;
  passed: boolean;
  error?: string;
}

const testResults: TestSummary[] = [];

async function recordTest(name: string, fn: () => Promise<void>) {
  process.stdout.write(`▶️  Testing: ${name}... `);
  try {
    await fn();
    console.log('✅ PASSED');
    testResults.push({ name, passed: true });
  } catch (err: any) {
    console.log(`❌ FAILED: ${err.message}`);
    testResults.push({ name, passed: false, error: err.message });
  }
}

async function runQALifecycleSuite() {
  console.log('\n===============================================================');
  console.log('🧪 SubFlow Senior QA Engineer: Comprehensive End-to-End Suite');
  console.log('===============================================================\n');

  const app = await buildApp();
  await app.ready();

  function createToken(payload: { id: string; email: string; role: Role; name: string; customerId?: string | null }) {
    return app.jwt.sign(payload);
  }

  // Admin and Staff credentials for QA suite
  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  assert.ok(adminUser, 'Admin user must exist in database');

  const adminToken = createToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    name: adminUser.name,
    customerId: null,
  });

  const timestamp = Date.now();
  const testCustomerEmail = `qa_customer_${timestamp}@subflow-qa.io`;
  const testCustomerPassword = `SubFlow#SecurePass${timestamp}!`;
  let customerToken: string = '';
  let registeredUserId: string = '';
  let registeredCustomerId: string = '';

  let createdProductId: string = '';
  let createdPlanId: string = '';
  let createdQuotationId: string = '';
  let createdSubscriptionId: string = '';
  let createdInvoiceId: string = '';

  // =========================================================================
  // STAGE 1: REGISTRATION & CUSTOMER CREATION
  // =========================================================================
  await recordTest('1.1 Customer Self-Registration & Customer Entity Creation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'QA Test Customer',
        email: testCustomerEmail,
        password: testCustomerPassword,
        phone: '+1-555-0199',
      },
    });

    assert.strictEqual(res.statusCode, 201, `Expected 201 Created, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.email, testCustomerEmail);
    assert.strictEqual(body.data.user.role, Role.CUSTOMER);
    assert.ok(body.data.customer?.id, 'Linked customer ID must be returned');

    registeredUserId = body.data.user.id;
    registeredCustomerId = body.data.customer.id;
    customerToken = body.data.token;
  });

  await recordTest('1.2 Duplicate Email Registration Rejection', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Duplicate QA Customer',
        email: testCustomerEmail,
        password: testCustomerPassword,
      },
    });

    assert.strictEqual(res.statusCode, 409, `Expected 409 Conflict, got ${res.statusCode}`);
  });

  // =========================================================================
  // STAGE 2: PRODUCT MANAGEMENT & CATALOG CREATION
  // =========================================================================
  await recordTest('2.1 Product & Variants Creation by Admin', async () => {
    const productPayload = {
      name: `QA Enterprise Cloud Engine ${timestamp}`,
      code: `PROD-QA-${timestamp}`,
      type: 'SERVICE',
      salesPrice: 2500.00,
      costPrice: 800.00,
      description: 'QA High performance dedicated cloud processing cluster',
      status: 'ACTIVE',
      variants: [
        {
          variantName: 'High-RAM Tier',
          brand: 'SubFlow Cloud',
          additionalPrice: 500.00,
          sku: `SKU-HRAM-${timestamp}`,
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: productPayload,
    });

    assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.product.id);
    assert.strictEqual(body.data.product.variants.length, 1);

    createdProductId = body.data.product.id;
  });

  // =========================================================================
  // STAGE 3: PLAN CREATION
  // =========================================================================
  await recordTest('3.1 Subscription Plan Creation with Recurring Billing Interval', async () => {
    const planPayload = {
      name: `QA Cloud Monthly Pro ${timestamp}`,
      code: `PLAN-QA-${timestamp}`,
      description: 'Monthly dedicated cloud instance for QA test runs',
      billingInterval: 'MONTHLY',
      price: 2500.00,
      currency: 'USD',
      minQuantity: 1,
      startDate: new Date().toISOString(),
      autoClose: false,
      status: 'ACTIVE',
      productId: createdProductId,
      items: [
        {
          productId: createdProductId,
          quantity: 1,
          unitPrice: 2500.00,
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/plans',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: planPayload,
    });

    assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.plan.id);
    assert.strictEqual(body.data.plan.billingInterval, 'MONTHLY');

    createdPlanId = body.data.plan.id;
  });

  // =========================================================================
  // STAGE 4: QUOTATION & FINANCIAL CALCULATION (TAXES + DISCOUNTS)
  // =========================================================================
  await recordTest('4.1 Quotation Creation with Subtotal, Discount, Tax & Grand Total Precision', async () => {
    // 2 units @ $2500 = $5000 subtotal
    // 10% discount = $500 discount -> Taxable $4500
    // 18% tax = $810 tax
    // Total = $5310
    const quotePayload = {
      customerId: registeredCustomerId,
      validityDays: 30,
      termsAndConditions: 'Standard QA Net 30 terms',
      notes: 'Automated QA generated quote',
      lines: [
        {
          productId: createdProductId,
          description: 'Enterprise Cloud cluster',
          quantity: 2,
          unitPrice: 2500.00,
          discountPercent: 10.00,
          taxPercent: 18.00,
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/quotations',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: quotePayload,
    });

    assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);

    const quote = body.data.quotation;
    assert.strictEqual(new Decimal(quote.subtotal).toFixed(2), '5000.00');
    assert.strictEqual(new Decimal(quote.discountAmount).toFixed(2), '500.00');
    assert.strictEqual(new Decimal(quote.taxAmount).toFixed(2), '810.00');
    assert.strictEqual(new Decimal(quote.totalAmount).toFixed(2), '5310.00');
    assert.strictEqual(quote.status, QuotationStatus.DRAFT);

    createdQuotationId = quote.id;
  });

  // =========================================================================
  // STAGE 5: QUOTATION CONVERSION & SUBSCRIPTION ACTIVATION
  // =========================================================================
  await recordTest('5.1 Quotation Conversion into Active Subscription', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/quotations/${createdQuotationId}/convert`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        planId: createdPlanId,
        billingInterval: 'MONTHLY',
      },
    });

    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.quotation.status, QuotationStatus.CONVERTED);
    assert.strictEqual(body.data.subscription.status, SubscriptionStatus.ACTIVE);
    assert.strictEqual(new Decimal(body.data.subscription.totalAmount).toFixed(2), '5310.00');

    createdSubscriptionId = body.data.subscription.id;
  });

  await recordTest('5.2 Duplicate Quotation Conversion Guard', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/quotations/${createdQuotationId}/convert`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { planId: createdPlanId },
    });

    assert.strictEqual(res.statusCode, 400, 'Duplicate conversion must be rejected with 400');
  });

  // =========================================================================
  // STAGE 6: BILLING ENGINE EXECUTION & INVOICE GENERATION
  // =========================================================================
  await recordTest('6.1 Recurring Billing Engine: Automated Invoice Generation', async () => {
    // Reconcile any pre-existing subscriptions so only our newly created subscription is due
    await prisma.subscription.updateMany({
      where: { status: 'ACTIVE', nextBillingDate: { lte: new Date() } },
      data: { nextBillingDate: new Date('2026-12-01T00:00:00.000Z') },
    });

    // Force our test subscription nextBillingDate to slightly past so it is due now
    await prisma.subscription.update({
      where: { id: createdSubscriptionId },
      data: {
        nextBillingDate: new Date(Date.now() - 10000),
      },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/billing/run',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.invoicesGenerated, 1, 'Exactly 1 invoice must be generated for the due subscription');

    // Retrieve generated invoice for our subscription
    const invoice = await prisma.invoice.findFirst({
      where: { subscriptionId: createdSubscriptionId },
      include: { lines: true },
    });

    assert.ok(invoice, 'Generated invoice must exist in database');
    assert.strictEqual(new Decimal(invoice.totalAmount).toFixed(2), '5310.00');
    assert.strictEqual(new Decimal(invoice.outstandingAmount).toFixed(2), '5310.00');
    assert.strictEqual(new Decimal(invoice.amountPaid).toFixed(2), '0.00');
    assert.strictEqual(invoice.status, InvoiceStatus.CONFIRMED);

    createdInvoiceId = invoice.id;
  });

  await recordTest('6.2 Duplicate Billing Prevention & Idempotency', async () => {
    // Run billing engine immediately again
    const res = await app.inject({
      method: 'POST',
      url: '/api/billing/run',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.data.invoicesGenerated, 0, 'Subsequent billing run must generate 0 duplicate invoices');
  });

  // =========================================================================
  // STAGE 7: PAYMENT RECONCILIATION & PARTIAL/FULL LEDGER SETTLEMENT
  // =========================================================================
  await recordTest('7.1 Partial Payment Processing & Ledger Reconciliation', async () => {
    const partialAmount = 2000.00;
    const res = await app.inject({
      method: 'POST',
      url: '/api/payments',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        invoiceId: createdInvoiceId,
        customerId: registeredCustomerId,
        amount: partialAmount,
        paymentMethod: 'CARD',
        reference: `PAY-PARTIAL-${timestamp}`,
      },
    });

    assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);

    const updatedInvoice = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
    assert.ok(updatedInvoice);
    assert.strictEqual(new Decimal(updatedInvoice.amountPaid).toFixed(2), '2000.00');
    assert.strictEqual(new Decimal(updatedInvoice.outstandingAmount).toFixed(2), '3310.00');
    assert.strictEqual(updatedInvoice.status, InvoiceStatus.PARTIALLY_PAID);
  });

  await recordTest('7.2 Full Settlement Payment & Status Transition to PAID', async () => {
    const remainingAmount = 3310.00;
    const res = await app.inject({
      method: 'POST',
      url: '/api/payments',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        invoiceId: createdInvoiceId,
        customerId: registeredCustomerId,
        amount: remainingAmount,
        paymentMethod: 'BANK_TRANSFER',
        reference: `PAY-FULL-${timestamp}`,
      },
    });

    assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${res.body}`);

    const updatedInvoice = await prisma.invoice.findUnique({ where: { id: createdInvoiceId } });
    assert.ok(updatedInvoice);
    assert.strictEqual(new Decimal(updatedInvoice.amountPaid).toFixed(2), '5310.00');
    assert.strictEqual(new Decimal(updatedInvoice.outstandingAmount).toFixed(2), '0.00');
    assert.strictEqual(updatedInvoice.status, InvoiceStatus.PAID);
  });

  // =========================================================================
  // STAGE 8: DASHBOARD ANALYTICS & REVENUE ACCURACY
  // =========================================================================
  await recordTest('8.1 Dashboard Metrics Consistency & Mathematical Accuracy', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/dashboard/metrics',
      headers: { authorization: `Bearer ${adminToken}` },
    });

    assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${res.body}`);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    const metrics = body.data.kpis;

    assert.ok(metrics.activeSubscriptions > 0, 'Active subscriptions count must be > 0');
    assert.ok(new Decimal(metrics.revenueCollected).gte(5310.00), 'Revenue collected must account for settled payments');
    assert.ok(new Decimal(metrics.mrr).gt(0), 'MRR must be non-zero for active subscriptions');
    assert.ok(Math.abs(metrics.arr - metrics.mrr * 12) <= 24, 'ARR must closely match MRR * 12 within rounding tolerance');
  });

  // =========================================================================
  // STAGE 9: INVALID INPUT VALIDATION & BOUNDARY TESTS
  // =========================================================================
  await recordTest('9.1 Rejection of Invalid Registration (Weak Password / Malformed Email)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Bad Input User',
        email: 'invalid-email-string',
        password: 'short',
      },
    });
    assert.strictEqual(res.statusCode, 400, 'Malformed email/password must return 400');
  });

  await recordTest('9.2 Rejection of Negative Product Sales Price', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Negative Price Product',
        code: `PROD-NEG-${timestamp}`,
        type: 'SERVICE',
        salesPrice: -50.00,
      },
    });
    assert.strictEqual(res.statusCode, 400, 'Negative sales price must return 400');
  });

  await recordTest('9.3 Rejection of Payment on Already Paid Invoice', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/payments',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        invoiceId: createdInvoiceId,
        customerId: registeredCustomerId,
        amount: 100.00,
        paymentMethod: 'CASH',
      },
    });
    assert.strictEqual(res.statusCode, 400, 'Payment on already paid invoice must be rejected with 400');
  });

  await recordTest('9.4 Rejection of Non-Positive Payment Amounts', async () => {
    // Create a new unpaid invoice to test negative payment
    const invCount = await prisma.invoice.count();
    const unpaidInv = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-TEST-NEG-${timestamp}`,
        customerId: registeredCustomerId,
        subscriptionId: createdSubscriptionId,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        invoiceDate: new Date(),
        dueDate: new Date(),
        subtotal: 500,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 500,
        amountPaid: 0,
        outstandingAmount: 500,
        status: InvoiceStatus.CONFIRMED,
      },
    });

    const resNeg = await app.inject({
      method: 'POST',
      url: '/api/payments',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        invoiceId: unpaidInv.id,
        customerId: registeredCustomerId,
        amount: -50.00,
        paymentMethod: 'CASH',
      },
    });
    assert.strictEqual(resNeg.statusCode, 400, 'Negative payment must return 400');

    const resZero = await app.inject({
      method: 'POST',
      url: '/api/payments',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        invoiceId: unpaidInv.id,
        customerId: registeredCustomerId,
        amount: 0,
        paymentMethod: 'CASH',
      },
    });
    assert.strictEqual(resZero.statusCode, 400, 'Zero payment must return 400');
  });

  // =========================================================================
  // STAGE 10: UNAUTHORIZED ACCESS & ROLE-BASED ACCESS CONTROL (RBAC)
  // =========================================================================
  await recordTest('10.1 Unauthenticated Access Denial (401)', async () => {
    const endpoints = ['/api/customers', '/api/subscriptions', '/api/invoices', '/api/billing/history'];
    for (const url of endpoints) {
      const res = await app.inject({ method: 'GET', url });
      assert.strictEqual(res.statusCode, 401, `Expected 401 for unauthenticated ${url}, got ${res.statusCode}`);
    }
  });

  await recordTest('10.2 Customer Role Access Denial to Staff/Admin Resources (403)', async () => {
    const privilegedRequests = [
      { method: 'GET', url: '/api/customers' },
      { method: 'POST', url: '/api/billing/run', payload: {} },
      { method: 'POST', url: '/api/products', payload: { name: 'X', code: 'X', salesPrice: 10 } },
      { method: 'GET', url: '/api/audit' },
    ];

    for (const req of privilegedRequests) {
      const res = await app.inject({
        method: req.method as any,
        url: req.url,
        headers: { authorization: `Bearer ${customerToken}` },
        payload: req.payload,
      });
      assert.strictEqual(res.statusCode, 403, `Customer must be forbidden (403) from ${req.url}, got ${res.statusCode}`);
    }
  });

  // =========================================================================
  // STAGE 11: CONCURRENT REQUESTS & RACE CONDITION TORTURE TESTS
  // =========================================================================
  await recordTest('11.1 Concurrent Payments Against a Limited Invoice Balance', async () => {
    // Create an invoice with $100 outstanding
    const concurrentInv = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-RACE-${timestamp}`,
        customerId: registeredCustomerId,
        subscriptionId: createdSubscriptionId,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        invoiceDate: new Date(),
        dueDate: new Date(),
        subtotal: 100.00,
        discountAmount: 0.00,
        taxAmount: 0.00,
        totalAmount: 100.00,
        amountPaid: 0.00,
        outstandingAmount: 100.00,
        status: InvoiceStatus.CONFIRMED,
      },
    });

    // Fire 5 simultaneous requests attempting to pay $100 each
    const promises = Array.from({ length: 5 }).map((_, i) =>
      app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          invoiceId: concurrentInv.id,
          customerId: registeredCustomerId,
          amount: 100.00,
          paymentMethod: 'CARD',
          reference: `CONCURRENT-PAY-${timestamp}-${i}`,
        },
      })
    );

    const responses = await Promise.all(promises);

    const successes = responses.filter(r => r.statusCode === 201);
    const failures = responses.filter(r => r.statusCode >= 400);

    // Exactly 1 must succeed; all other 4 must be rejected due to balance depletion
    assert.strictEqual(successes.length, 1, `Expected exactly 1 payment to succeed, got ${successes.length}`);
    assert.strictEqual(failures.length, 4, `Expected 4 payments to fail, got ${failures.length}`);

    // Verify invoice final state: exactly $100 paid, $0 outstanding, status PAID
    const verifiedInv = await prisma.invoice.findUnique({ where: { id: concurrentInv.id } });
    assert.ok(verifiedInv);
    assert.strictEqual(new Decimal(verifiedInv.amountPaid).toFixed(2), '100.00');
    assert.strictEqual(new Decimal(verifiedInv.outstandingAmount).toFixed(2), '0.00');
    assert.strictEqual(verifiedInv.status, InvoiceStatus.PAID);
  });

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n===============================================================');
  console.log('📊 Senior QA Engineer: Test Execution Report');
  console.log('===============================================================');
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;

  console.log(`Total Tests Run: ${testResults.length}`);
  console.log(`Passed:         ${passed} ✅`);
  console.log(`Failed:         ${failed} ❌`);

  if (failed > 0) {
    console.log('\nFailed Tests Detail:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 ALL QA LIFECYCLE, INTEGRATION, AND TORTURE TESTS PASSED!\n');
  }
}

runQALifecycleSuite().catch((err) => {
  console.error('Fatal QA Runner Error:', err);
  process.exit(1);
});
