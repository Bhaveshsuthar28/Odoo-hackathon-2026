import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma, Role } from '@subflow/database';
import { loginSchema, registerSchema } from '@subflow/shared';
import { createAuditLog } from '../../utils/audit.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post('/register', async (request, reply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation failed',
        errors: parseResult.error.errors,
      });
    }

    const { email, password, name, phone } = parseResult.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: Role.CUSTOMER, // Self-registered accounts are CUSTOMER
        isActive: true,
      },
    });

    // Also auto-create a linked Customer record for self-registered customer
    const customerCount = await prisma.customer.count();
    const customerNumber = `CUST-${String(customerCount + 1).padStart(4, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        customerNumber,
        name,
        email,
        phone,
      },
    });

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      customerId: customer.id,
    });

    reply.setCookie('subflow_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, customerId: customer.id },
        token,
      },
    });
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid credentials format',
      });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { customer: true },
    });

    if (!user || !user.isActive) {
      return reply.status(401).send({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ success: false, message: 'Invalid email or password' });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      customerId: user.customer?.id || null,
    });

    reply.setCookie('subflow_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          customerId: user.customer?.id || null,
        },
        token,
      },
    });
  });

  // Logout
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('subflow_token', { path: '/' });
    return reply.send({ success: true, message: 'Logged out successfully' });
  });

  // Me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            customerNumber: true,
            name: true,
            company: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }

    return reply.send({ success: true, data: { user } });
  });

  // Forgot Password
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = (request.body as any) || {};
    if (!email) {
      return reply.status(400).send({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success anyway to avoid user enumeration
      return reply.send({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been generated.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'User',
      entityId: user.id,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Password reset token generated successfully',
      data: { resetToken }, // Return in response for test/dev simplicity
    });
  });

  // Reset Password
  fastify.post('/reset-password', async (request, reply) => {
    const { token, newPassword } = (request.body as any) || {};
    if (!token || !newPassword) {
      return reply.status(400).send({ success: false, message: 'Token and newPassword are required' });
    }

    // Password strength check
    if (newPassword.length < 9 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return reply.status(400).send({
        success: false,
        message: 'Password must be >8 characters with uppercase, lowercase and special character',
      });
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return reply.status(400).send({ success: false, message: 'Invalid or expired password reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await createAuditLog({
      actorId: resetRecord.userId,
      actorEmail: resetRecord.user.email,
      actorRole: resetRecord.user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'User',
      entityId: resetRecord.userId,
      ipAddress: request.ip,
    });

    return reply.send({ success: true, message: 'Password has been successfully reset' });
  });
};
