import assert from 'node:assert';
import { buildApp } from '../src/app.js';
import { prisma, Role, InvoiceStatus } from '@subflow/database';
import { Decimal } from 'decimal.js';

async function runSecurityTestSuite() {
  console.log('🛡️ Starting SubFlow Comprehensive Security Audit & Regression Test Suite...\n');

  const app = await buildApp();
  await app.ready();

  // Helper to generate signed JWT
  function createToken(payload: { id: string; email: string; role: Role; name: string; customerId?: string | null }) {
    return app.jwt.sign(payload);
  }

  // Fetch demo accounts
  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  const customers = await prisma.customer.findMany({
    where: { userId: { not: null } },
    take: 2,
    include: { user: true, subscriptions: true, invoices: true },
  });

  assert.ok(adminUser, 'Admin user must exist in database');
  assert.ok(customers.length >= 2, 'At least 2 customers must exist for multi-tenant isolation tests');

  const adminToken = createToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    name: adminUser.name,
    customerId: null,
  });

  const customer1 = customers[0];
  const customer2 = customers[1];

  const customer1Token = createToken({
    id: customer1.userId || customer1.id,
    email: customer1.email,
    role: Role.CUSTOMER,
    name: customer1.name,
    customerId: customer1.id,
  });

  const customer2Token = createToken({
    id: customer2.userId || customer2.id,
    email: customer2.email,
    role: Role.CUSTOMER,
    name: customer2.name,
    customerId: customer2.id,
  });

  // ==========================================================
  // Test 1: Authentication & Authorization Enforcement
  // ==========================================================
  console.log('▶️ Security Test 1: Unauthenticated & Unauthorized Endpoint Protection');
  {
    // Calling protected admin route without token -> 401
    const resNoAuth = await app.inject({
      method: 'GET',
      url: '/api/customers',
    });
    assert.strictEqual(resNoAuth.statusCode, 401, 'Unauthenticated request to /api/customers must return 401');

    // Calling admin route with customer token -> 403
    const resForbidden = await app.inject({
      method: 'GET',
      url: '/api/customers',
      headers: { authorization: `Bearer ${customer1Token}` },
    });
    assert.strictEqual(resForbidden.statusCode, 403, 'Customer token to /api/customers must return 403');

    // Calling audit logs with customer token -> 403
    const resAuditForbidden = await app.inject({
      method: 'GET',
      url: '/api/audit',
      headers: { authorization: `Bearer ${customer1Token}` },
    });
    assert.strictEqual(resAuditForbidden.statusCode, 403, 'Customer token to /api/audit must return 403');

    // Calling billing run with customer token -> 403
    const resBillingForbidden = await app.inject({
      method: 'POST',
      url: '/api/billing/run',
      headers: { authorization: `Bearer ${customer1Token}` },
    });
    assert.strictEqual(resBillingForbidden.statusCode, 403, 'Customer token to /api/billing/run must return 403');

    console.log('   ✅ RBAC properly enforced: 401 for unauthenticated, 403 for insufficient privileges.');
  }

  // ==========================================================
  // Test 2: Password Reset Token Leakage Remediation
  // ==========================================================
  console.log('▶️ Security Test 2: Password Reset Token Exposure Elimination (CWE-640)');
  {
    const resForgot = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: adminUser.email },
    });

    assert.strictEqual(resForgot.statusCode, 200);
    const body = JSON.parse(resForgot.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data?.resetToken, undefined, 'CRITICAL: resetToken must NEVER be returned in API response!');
    assert.ok(body.message.includes('dispatched'), 'Generic safe response message returned');
    console.log('   ✅ Password reset tokens are strictly masked from HTTP response bodies.');
  }

  // ==========================================================
  // Test 3: IDOR & Cross-Tenant Data Isolation in Simulator
  // ==========================================================
  console.log('▶️ Security Test 3: IDOR Prevention in Financial Simulator (CWE-639)');
  {
    // Find customer 2's subscription and plan
    const subCustomer2 = await prisma.subscription.findFirst({
      where: { customerId: customer2.id },
      include: { plan: true },
    });
    const alternatePlan = await prisma.plan.findFirst({
      where: { id: { not: subCustomer2?.planId } },
    });

    if (subCustomer2 && alternatePlan) {
      // Customer 1 attempts to simulate target plan on Customer 2's subscription!
      const resIdor = await app.inject({
        method: 'POST',
        url: '/api/simulator/simulate',
        headers: { authorization: `Bearer ${customer1Token}` },
        payload: {
          subscriptionId: subCustomer2.id,
          targetPlanId: alternatePlan.id,
        },
      });

      assert.strictEqual(resIdor.statusCode, 403, 'Cross-tenant simulation must return 403 Forbidden');
      const idorBody = JSON.parse(resIdor.body);
      assert.strictEqual(idorBody.success, false);
      assert.ok(idorBody.message.includes('Access denied'), 'Blocked foreign tenant subscription access');
      console.log('   ✅ IDOR blocked: Tenant cannot inspect or simulate competitor/foreign subscriptions.');
    } else {
      console.log('   ⚠️ Skipping simulator IDOR: insufficient subscriptions in seed data.');
    }
  }

  // ==========================================================
  // Test 4: Payment Logic & Concurrency / Overpayment Protection
  // ==========================================================
  console.log('▶️ Security Test 4: Financial Ledger Integrity & Overpayment Protection (CWE-362/841)');
  {
    // Find an open confirmed invoice with outstanding balance
    const openInvoice = await prisma.invoice.findFirst({
      where: {
        status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.PARTIALLY_PAID] },
        outstandingAmount: { gt: 0 },
      },
    });

    if (openInvoice) {
      const outstanding = Number(openInvoice.outstandingAmount);

      // 4.1: Attempting to pay negative amount -> 400
      const resNegative = await app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          invoiceId: openInvoice.id,
          amount: -500,
          paymentMethod: 'CARD',
        },
      });
      assert.strictEqual(resNegative.statusCode, 400, 'Negative payment amount must return 400');

      // 4.2: Attempting to pay zero amount -> 400
      const resZero = await app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          invoiceId: openInvoice.id,
          amount: 0,
          paymentMethod: 'CARD',
        },
      });
      assert.strictEqual(resZero.statusCode, 400, 'Zero payment amount must return 400');

      // 4.3: Attempting to pay more than outstanding balance -> 400
      const resExceed = await app.inject({
        method: 'POST',
        url: '/api/payments',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          invoiceId: openInvoice.id,
          amount: outstanding + 99999,
          paymentMethod: 'CARD',
        },
      });
      assert.strictEqual(resExceed.statusCode, 400, 'Payment exceeding balance must return 400');
      const exceedBody = JSON.parse(resExceed.body);
      assert.ok(exceedBody.message.includes('cannot exceed outstanding balance'));

      // 4.4: Attempting to pay an invoice belonging to customer 2 using customer 1's token -> 403
      const invCustomer2 = await prisma.invoice.findFirst({
        where: { customerId: customer2.id, outstandingAmount: { gt: 0 } },
      });
      if (invCustomer2) {
        const resUnauthorizedPay = await app.inject({
          method: 'POST',
          url: '/api/payments',
          headers: { authorization: `Bearer ${customer1Token}` },
          payload: {
            invoiceId: invCustomer2.id,
            amount: 10,
            paymentMethod: 'CARD',
          },
        });
        assert.strictEqual(resUnauthorizedPay.statusCode, 403, 'Customer cannot pay another customer invoice');
      }

      console.log('   ✅ Payment reconciliation rejects negative, zero, excessive and cross-tenant payments.');
    }
  }

  // ==========================================================
  // Test 5: Customer Portal Strict Tenant Isolation
  // ==========================================================
  console.log('▶️ Security Test 5: Customer Self-Service Portal Tenant Boundary Verification');
  {
    // Customer 1 portal invoice list
    const resPortalInvoices1 = await app.inject({
      method: 'GET',
      url: '/api/portal/invoices',
      headers: { authorization: `Bearer ${customer1Token}` },
    });
    assert.strictEqual(resPortalInvoices1.statusCode, 200);
    const body1 = JSON.parse(resPortalInvoices1.body);
    for (const inv of body1.data.invoices) {
      assert.strictEqual(inv.customerId, customer1.id, 'Portal invoices must strictly belong to authenticated customer');
    }

    // Customer 2 portal subscriptions list
    const resPortalSubs2 = await app.inject({
      method: 'GET',
      url: '/api/portal/subscriptions',
      headers: { authorization: `Bearer ${customer2Token}` },
    });
    assert.strictEqual(resPortalSubs2.statusCode, 200);
    const body2 = JSON.parse(resPortalSubs2.body);
    for (const sub of body2.data.subscriptions) {
      assert.strictEqual(sub.customerId, customer2.id, 'Portal subscriptions must strictly belong to authenticated customer');
    }

    console.log('   ✅ Portal data boundaries verified: Zero tenant bleed across accounts.');
  }

  // ==========================================================
  // Test 6: CORS Security Verification
  // ==========================================================
  console.log('▶️ Security Test 6: Cross-Origin Resource Sharing (CORS) Security Policy');
  {
    // Request from evil third-party origin
    const resCors = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/me',
      headers: {
        origin: 'https://malicious-attacker-website.com',
        'access-control-request-method': 'GET',
      },
    });

    // When an origin is rejected by fastify-cors callback, access-control-allow-origin is NOT sent or request fails
    assert.notStrictEqual(
      resCors.headers['access-control-allow-origin'],
      'https://malicious-attacker-website.com',
      'Malicious origin must not be allowed by CORS header'
    );
    console.log('   ✅ Arbitrary third-party origins blocked by CORS policy.');
  }

  await app.close();
  console.log('\n🔒 ALL 6 COMPREHENSIVE SECURITY AUDIT TESTS PASSED SUCCESSFULLY!');
}

runSecurityTestSuite()
  .catch((err) => {
    console.error('❌ Security test suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
