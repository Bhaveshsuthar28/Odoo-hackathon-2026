import { FastifyPluginAsync } from 'fastify';
import { prisma, ProductStatus } from '@subflow/database';
import { productSchema } from '@subflow/shared';
import { createAuditLog } from '../../utils/audit.js';

export const productRoutes: FastifyPluginAsync = async (fastify) => {
  // Read operations can be accessed by authenticated staff or admin
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { search, status } = request.query as any;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        plans: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: { products } });
  });

  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        plans: true,
      },
    });

    if (!product) {
      return reply.status(404).send({ success: false, message: 'Product not found' });
    }

    return reply.send({ success: true, data: { product } });
  });

  // Write operations require STAFF or ADMIN
  fastify.post('/', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const parseResult = productSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const { variants, ...productData } = parseResult.data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        variants: variants && variants.length > 0 ? {
          create: variants.map((v) => ({
            variantName: v.variantName,
            brand: v.brand,
            additionalPrice: v.additionalPrice,
            sku: v.sku,
          })),
        } : undefined,
      },
      include: { variants: true },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product.id,
      details: { name: product.name, code: product.code },
      ipAddress: request.ip,
    });

    return reply.status(201).send({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  });

  fastify.put('/:id', { preHandler: [fastify.requireStaffOrAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parseResult = productSchema.partial().safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const { variants, ...productData } = parseResult.data;

    const product = await prisma.product.update({
      where: { id },
      data: productData,
      include: { variants: true },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: product.id,
      details: productData,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  });

  fastify.delete('/:id', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });

    await createAuditLog({
      actorId: request.user.id,
      actorEmail: request.user.email,
      actorRole: request.user.role,
      action: 'PRODUCT_ARCHIVED',
      entity: 'Product',
      entityId: id,
      ipAddress: request.ip,
    });

    return reply.send({
      success: true,
      message: 'Product archived successfully',
      data: { product },
    });
  });
};
