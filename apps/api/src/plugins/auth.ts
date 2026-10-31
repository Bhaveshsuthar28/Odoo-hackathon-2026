import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { Role, prisma } from '@subflow/database';

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
      let token: string | undefined;

      // 1. Try Authorization header
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (request.cookies.subflow_token) {
        token = request.cookies.subflow_token;
      } else if ((request.query as any)?.token) {
        token = (request.query as any).token;
      }

      if (!token) {
        return reply.status(401).send({ success: false, message: 'Authentication required' });
      }

      const decoded = fastify.jwt.verify<AuthUser>(token);

      // Verify user in database to ensure role integrity and active account status
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, name: true, isActive: true, isVerified: true },
      });

      if (!dbUser || !dbUser.isActive) {
        return reply.status(401).send({ success: false, message: 'Account is deactivated or does not exist.' });
      }

      request.user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role, // Live role from database
        customerId: decoded.customerId,
      };
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
