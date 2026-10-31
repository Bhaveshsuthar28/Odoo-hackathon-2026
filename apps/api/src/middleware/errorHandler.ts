import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error);

  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      message: 'Validation error',
      errors: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Fastify schema validation error
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      message: 'Schema validation error',
      errors: error.validation,
    });
  }

  // Handle unique constraint violation in Prisma (P2002)
  if ((error as any).code === 'P2002') {
    return reply.status(409).send({
      success: false,
      message: 'A record with this unique identifier already exists',
      fields: (error as any).meta?.target,
    });
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : error.message || 'An unexpected error occurred';

  return reply.status(statusCode).send({
    success: false,
    message,
  });
}
