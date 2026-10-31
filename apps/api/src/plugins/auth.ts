import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { Role } from '@subflow/database';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  customerId?: string | null;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireStaffOrAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireCustomer: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET || 'super-secret-subflow-cookie-key-2026-min-32-chars',
    parseOptions: {},
  });

  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super-secret-subflow-jwt-token-key-2026-min-32-chars',
    cookie: {
      cookieName: 'subflow_token',
      signed: false,
    },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Try Authorization header
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = fastify.jwt.verify<AuthUser>(token);
        request.user = decoded;
        return;
      }

      // 2. Try cookie
      const token = request.cookies.subflow_token;
      if (token) {
        const decoded = fastify.jwt.verify<AuthUser>(token);
        request.user = decoded;
        return;
      }

      return reply.status(401).send({ success: false, message: 'Authentication required' });
    } catch (err) {
      return reply.status(401).send({ success: false, message: 'Invalid or expired session token' });
    }
  });

  fastify.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.authenticate(request, reply);
    if (reply.sent) return;

    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ success: false, message: 'Access denied: Administrator privileges required' });
    }
  });

  fastify.decorate('requireStaffOrAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.authenticate(request, reply);
    if (reply.sent) return;

    if (request.user.role !== 'ADMIN' && request.user.role !== 'STAFF') {
      return reply.status(403).send({ success: false, message: 'Access denied: Staff or Administrator privileges required' });
    }
  });

  fastify.decorate('requireCustomer', async (request: FastifyRequest, reply: FastifyReply) => {
    await fastify.authenticate(request, reply);
    if (reply.sent) return;

    if (request.user.role !== 'CUSTOMER') {
      return reply.status(403).send({ success: false, message: 'Access denied: Customer portal account required' });
    }
  });
};

export default fp(authPlugin);
