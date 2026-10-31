import { FastifyPluginAsync } from 'fastify';
import { prisma, Role } from '@subflow/database';
import crypto from 'crypto';
import { createAuditLog } from '../../utils/audit.js';
import { hashPassword, validatePasswordPolicy } from '../../utils/security.js';

export const staffRoutes: FastifyPluginAsync = async (fastify) => {
  // Enforce: Only authenticated ADMIN can access staff management
  fastify.addHook('preHandler', fastify.requireAdmin);

  // List all staff members
  fastify.get('/', async (request, reply) => {
    const staffMembers = await prisma.user.findMany({
      where: { role: Role.STAFF },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        requiresPasswordChange: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: { staff: staffMembers },
    });
  });

  // Create new staff account (Admin only)
  fastify.post('/', async (request, reply) => {
    const { name, email, phone, password } = request.body as any;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return reply.status(400).send({ success: false, message: 'Valid full name is required.' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return reply.status(400).send({ success: false, message: 'Valid email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return reply.status(409).send({ success: false, message: 'An account with this email address already exists.' });
    }

    // Determine temporary password
    let tempPassword = password;
    if (!tempPassword) {
      // Auto-generate strong temporary password
      tempPassword = `Staff#${crypto.randomBytes(4).toString('hex')}2026!`;
    } else {
      const policy = validatePasswordPolicy(tempPassword);
      if (!policy.valid) {
        return reply.status(400).send({ success: false, message: policy.message });
      }
    }

    const passwordHash = await hashPassword(tempPassword);

    const newStaff = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: Role.STAFF,
        isActive: true,
        isVerified: true, // Staff accounts created by Admin are pre-verified
        requiresPasswordChange: true, // Require password update upon first login
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        requiresPasswordChange: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'STAFF_ACCOUNT_CREATED',
      entity: 'User',
      entityId: newStaff.id,
      details: { staffEmail: newStaff.email, staffName: newStaff.name },
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Staff account created successfully.',
      data: {
        staff: newStaff,
        temporaryPassword: tempPassword,
        note: 'Please share this temporary password securely with the staff member. They will be prompted to set a new password on first login.',
      },
    });
  });

  // Toggle staff active status
  fastify.patch('/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { isActive } = request.body as any;

    const staff = await prisma.user.findUnique({ where: { id } });
    if (!staff || staff.role !== Role.STAFF) {
      return reply.status(404).send({ success: false, message: 'Staff member not found.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      select: { id: true, email: true, name: true, isActive: true },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: updated.isActive ? 'STAFF_ACCOUNT_ACTIVATED' : 'STAFF_ACCOUNT_DEACTIVATED',
      entity: 'User',
      entityId: id,
      details: { staffEmail: updated.email, isActive: updated.isActive },
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: `Staff account ${updated.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { staff: updated },
    });
  });
};
