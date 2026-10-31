import assert from 'node:assert';
import { buildApp } from '../src/app.js';
import { prisma, Role } from '@subflow/database';

async function runRoleAuthOtpTests() {
  console.log('🧪 Starting SubFlow Role-Based Auth & Gmail OTP Automated Verification Suite...\n');
  const app = await buildApp();

  const testGmail = `test.subflow.${Date.now()}@gmail.com`;
  const nonGmail = `test.subflow.${Date.now()}@outlook.com`;
  const securePassword = 'TestPassword123!#';

  // 1. Customer registration with non-Gmail
  console.log('▶️ Test 1: Reject Customer Registration with non-Gmail domain');
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/register',
      payload: {
        name: 'Invalid Domain User',
        email: nonGmail,
        password: securePassword,
        confirmPassword: securePassword,
        termsAccepted: true,
      },
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('@gmail.com'));
    console.log('   ✅ Non-Gmail registration rejected as expected.');
  }

  // 2. Customer registration with weak password
  console.log('▶️ Test 2: Reject Customer Registration with weak password');
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/register',
      payload: {
        name: 'Weak Pass User',
        email: testGmail,
        password: 'weakpassword',
        confirmPassword: 'weakpassword',
        termsAccepted: true,
      },
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    console.log('   ✅ Weak password rejected.');
  }

  // 3. Valid Customer registration with @gmail.com
  console.log('▶️ Test 3: Customer Registration with valid Gmail & OTP dispatch');
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/register',
      payload: {
        name: 'Alice Subscriber',
        email: testGmail,
        password: securePassword,
        confirmPassword: securePassword,
        termsAccepted: true,
      },
    });
    assert.strictEqual(res.statusCode, 201);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data?.otp, undefined, 'CRITICAL: Raw OTP must NEVER be exposed in API responses');

    // Verify unverified status in DB
    const userInDb = await prisma.user.findUnique({ where: { email: testGmail } });
    assert.ok(userInDb, 'User record created in database');
    assert.strictEqual(userInDb.isVerified, false, 'User must remain unverified until OTP check');
    assert.strictEqual(userInDb.role, Role.CUSTOMER);

    // Verify OTP record exists with hashed OTP
    const otpRecord = await prisma.emailVerificationOTP.findFirst({
      where: { userId: userInDb.id, isUsed: false },
    });
    assert.ok(otpRecord, 'OTP record created in database');
    assert.strictEqual(otpRecord.otpHash.length, 64, 'OTP must be stored as SHA-256 HMAC hash');
    console.log('   ✅ Customer registered, OTP hashed in DB, raw code masked.');
  }

  // 4. Attempt login before email verification
  console.log('▶️ Test 4: Prevent unverified customer login');
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/login',
      payload: {
        email: testGmail,
        password: securePassword,
      },
    });
    assert.strictEqual(res.statusCode, 403);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.requiresVerification, true);
    console.log('   ✅ Unverified customer denied login.');
  }

  // 5. Verify email with wrong OTP
  console.log('▶️ Test 5: Reject invalid OTP');
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/verify-email',
      payload: {
        email: testGmail,
        otp: '999999',
      },
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    console.log('   ✅ Invalid OTP rejected.');
  }

  // 6. Resend OTP cooldown enforcement (<60s)
  console.log('▶️ Test 6: Enforce 60-second cooldown on OTP resend');
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/resend-otp',
      payload: { email: testGmail },
    });
    assert.strictEqual(res.statusCode, 429);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('wait'));
    console.log('   ✅ 60s cooldown enforced with 429 Too Many Requests.');
  }

  // 7. Verify email with valid OTP (lookup hash in test or set known code)
  console.log('▶️ Test 7: Verify customer email with valid OTP & grant session');
  {
    // Retrieve OTP record and simulate legitimate verification
    const user = await prisma.user.findUnique({ where: { email: testGmail } });
    const { hashOTP } = await import('../src/utils/security.js');
    const knownOTP = '458219';
    await prisma.emailVerificationOTP.updateMany({
      where: { userId: user!.id },
      data: { otpHash: hashOTP(knownOTP), attempts: 0 },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/verify-email',
      payload: {
        email: testGmail,
        otp: knownOTP,
      },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data?.token, 'JWT token issued upon verification');

    const verifiedUser = await prisma.user.findUnique({ where: { email: testGmail } });
    assert.strictEqual(verifiedUser?.isVerified, true, 'User isVerified now set to true');
    console.log('   ✅ Email successfully verified and JWT session issued.');
  }

  // 8. Verified customer can now login
  console.log('▶️ Test 8: Verified Customer Login');
  let customerToken = '';
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/login',
      payload: {
        email: testGmail,
        password: securePassword,
      },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    customerToken = body.data.token;
    console.log('   ✅ Customer login successful.');
  }

  // 9. Customer cannot log into /admin/login or /staff/login
  console.log('▶️ Test 9: Enforce Role Isolation (Customer rejected from Admin & Staff portals)');
  {
    const resAdmin = await app.inject({
      method: 'POST',
      url: '/api/auth/admin/login',
      payload: {
        email: testGmail,
        password: securePassword,
      },
    });
    assert.ok([401, 403].includes(resAdmin.statusCode), `Admin login must reject customer, got ${resAdmin.statusCode}`);

    const resStaff = await app.inject({
      method: 'POST',
      url: '/api/auth/staff/login',
      payload: {
        email: testGmail,
        password: securePassword,
      },
    });
    assert.ok([401, 403].includes(resStaff.statusCode), `Staff login must reject customer, got ${resStaff.statusCode}`);
    console.log('   ✅ Role isolation enforced: Customer blocked from Admin & Staff login.');
  }

  // 10. Admin Login
  console.log('▶️ Test 10: Admin Authentication');
  const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  assert.ok(adminUser, 'Seed admin user exists');
  const adminToken = app.jwt.sign({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    name: adminUser.name,
  });

  const resAdminLogin = await app.inject({
    method: 'POST',
    url: '/api/auth/admin/login',
    payload: {
      email: adminUser.email,
      password: 'SubFlow@Admin2026!',
    },
  });
  assert.strictEqual(resAdminLogin.statusCode, 200);
  console.log('   ✅ Admin successfully logged into /admin/login.');

  // 11. Staff Management (Admin only)
  console.log('▶️ Test 11: Admin provisions a new Staff member with auto-generated temporary password');
  const staffEmail = `staff.${Date.now()}@subflow-internal.com`;
  let tempStaffPass = '';
  let createdStaffId = '';

  {
    // Customer cannot create staff
    const resForbidden = await app.inject({
      method: 'POST',
      url: '/api/admin/staff',
      headers: { authorization: `Bearer ${customerToken}` },
      payload: { name: 'Unauthorized Staff', email: staffEmail },
    });
    assert.strictEqual(resForbidden.statusCode, 403);

    // Admin creates staff
    const resCreate = await app.inject({
      method: 'POST',
      url: '/api/admin/staff',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Sarah Connor',
        email: staffEmail,
        phone: '+91 9876543210',
      },
    });
    assert.strictEqual(resCreate.statusCode, 201);
    const body = JSON.parse(resCreate.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.data?.temporaryPassword, 'Admin receives temporary staff password');
    tempStaffPass = body.data.temporaryPassword;
    createdStaffId = body.data.staff.id;
    assert.strictEqual(body.data.staff.role, Role.STAFF);
    assert.strictEqual(body.data.staff.isVerified, true);
    assert.strictEqual(body.data.staff.requiresPasswordChange, true);
    console.log('   ✅ Staff account created with temporary credentials.');
  }

  // 12. Staff can login with temporary credentials
  console.log('▶️ Test 12: Staff Login with temporary password');
  {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/staff/login',
      payload: {
        email: staffEmail,
        password: tempStaffPass,
      },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.role, Role.STAFF);
    assert.strictEqual(body.data.user.requiresPasswordChange, true);
    console.log('   ✅ Staff successfully signed in via /staff/login.');
  }

  // 13. Admin can list and toggle staff status
  console.log('▶️ Test 13: Admin lists staff & toggles active status');
  {
    const resList = await app.inject({
      method: 'GET',
      url: '/api/admin/staff',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(resList.statusCode, 200);
    const listBody = JSON.parse(resList.body);
    assert.ok(listBody.data.staff.some((s: any) => s.id === createdStaffId));

    // Deactivate staff
    const resToggle = await app.inject({
      method: 'PATCH',
      url: `/api/admin/staff/${createdStaffId}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { isActive: false },
    });
    assert.strictEqual(resToggle.statusCode, 200);
    const toggleBody = JSON.parse(resToggle.body);
    assert.strictEqual(toggleBody.data.staff.isActive, false);

    // Deactivated staff cannot login
    const resDeactLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/staff/login',
      payload: {
        email: staffEmail,
        password: tempStaffPass,
      },
    });
    assert.strictEqual(resDeactLogin.statusCode, 403);
    console.log('   ✅ Staff status toggle and access deactivation verified.');
  }

  // 14. Customer Password Recovery Workflow
  console.log('▶️ Test 14: Customer Password Recovery with 6-digit OTP');
  {
    const resForgot = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/forgot-password',
      payload: { email: testGmail },
    });
    assert.strictEqual(resForgot.statusCode, 200);

    // Check DB for password reset OTP
    const resetRecord = await prisma.passwordResetOTP.findFirst({
      where: { email: testGmail, isUsed: false },
    });
    assert.ok(resetRecord, 'Password reset OTP recorded in DB');

    // Simulate reset using known OTP
    const { hashOTP } = await import('../src/utils/security.js');
    const knownResetOTP = '789123';
    await prisma.passwordResetOTP.update({
      where: { id: resetRecord.id },
      data: { otpHash: hashOTP(knownResetOTP) },
    });

    const newPass = 'BrandNewPassword2026!#';
    const resReset = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/reset-password',
      payload: {
        email: testGmail,
        otp: knownResetOTP,
        newPassword: newPass,
      },
    });
    assert.strictEqual(resReset.statusCode, 200);

    // Verify login with new password
    const resNewLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/customer/login',
      payload: {
        email: testGmail,
        password: newPass,
      },
    });
    assert.strictEqual(resNewLogin.statusCode, 200);
    console.log('   ✅ Password reset OTP cycle completed and verified.');
  }

  console.log('\n===============================================================');
  console.log('🎉 ALL 14 ROLE-BASED AUTH & GMAIL OTP VERIFICATION TESTS PASSED!');
  console.log('===============================================================\n');

  await app.close();
  await prisma.$disconnect();
}

runRoleAuthOtpTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
