import { FastifyPluginAsync } from 'fastify';
import { prisma, CustomerStatus } from '@subflow/database';
import { customerSchema } from '@subflow/shared';
import { createAuditLog } from '../../utils/audit.js';

export const customerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireStaffOrAdmin);

  // List customers with search, status filter, pagination
  fastify.get('/', async (request, reply) => {
    const { search, status, page = '1', limit = '10' } = request.query as any;
    const pageNum = Math.max(1, parseInt(page, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * take;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              subscriptions: true,
              invoices: true,
            },
          },
        },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          page: pageNum,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  });

  // Get single customer details with full history
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            plan: true,
            lines: { include: { product: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: {
            payments: true,
          },
          orderBy: { invoiceDate: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return reply.status(404).send({ success: false, message: 'Customer not found' });
    }

    // Customer activity timeline constructed from records
    const timeline = [
      ...customer.subscriptions.map((s) => ({
        type: 'SUBSCRIPTION',
        title: `Subscription ${s.subscriptionNumber} (${s.status})`,
        description: `Plan: ${s.plan.name} - ₹${s.totalAmount}`,
        date: s.createdAt,
      })),
      ...customer.invoices.map((inv) => ({
        type: 'INVOICE',
        title: `Invoice ${inv.invoiceNumber} (${inv.status})`,
        description: `Total: ₹${inv.totalAmount} (Outstanding: ₹${inv.outstandingAmount})`,
        date: inv.invoiceDate,
      })),
      ...customer.payments.map((p) => ({
        type: 'PAYMENT',
        title: `Payment ${p.paymentNumber} (${p.status})`,
        description: `₹${p.amount} via ${p.paymentMethod} (Ref: ${p.reference || 'N/A'})`,
        date: p.paymentDate,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return reply.send({
      success: true,
      data: { customer, timeline },
    });
  });

  // Create customer
  fastify.post('/', async (request, reply) => {
    const parseResult = customerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const data = parseResult.data;

    const count = await prisma.customer.count();
    const customerNumber = `CUST-${String(count + 1).padStart(4, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        ...data,
        customerNumber,
      },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'CUSTOMER_CREATED',
      entity: 'Customer',
      entityId: customer.id,
      details: { name: customer.name, email: customer.email, customerNumber },
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Customer created successfully',
      data: { customer },
    });
  });

  // Update customer
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = customerSchema.partial().safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: parseResult.data,
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'CUSTOMER_UPDATED',
      entity: 'Customer',
      entityId: customer.id,
      details: parseResult.data,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Customer updated successfully',
      data: { customer },
    });
  });

  // Archive / Delete customer
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const customer = await prisma.customer.update({
      where: { id },
      data: { status: CustomerStatus.ARCHIVED },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'CUSTOMER_ARCHIVED',
      entity: 'Customer',
      entityId: id,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Customer archived successfully',
      data: { customer },
    });
  });
};
