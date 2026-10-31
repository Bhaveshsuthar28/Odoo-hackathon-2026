import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import authPlugin from './plugins/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import { authRoutes } from './modules/auth/auth.routes.js';
import { customerRoutes } from './modules/customers/customers.routes.js';
import { productRoutes } from './modules/products/products.routes.js';
import { planRoutes } from './modules/plans/plans.routes.js';
import { quotationRoutes } from './modules/quotations/quotations.routes.js';
import { subscriptionRoutes } from './modules/subscriptions/subscriptions.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { invoiceRoutes } from './modules/invoices/invoices.routes.js';
import { paymentRoutes } from './modules/payments/payments.routes.js';
import { discountRoutes } from './modules/discounts/discounts.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { portalRoutes } from './modules/portal/portal.routes.js';
import { leakageRoutes } from './modules/leakage/leakage.routes.js';
import { simulatorRoutes } from './modules/simulator/simulator.routes.js';
import { recoveryRoutes } from './modules/recovery/recovery.routes.js';
import { csvImportRoutes } from './modules/csv-import/csv-import.routes.js';
import { aiAssistantRoutes } from './modules/ai-assistant/ai-assistant.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: true,
  });

  // Secure CORS Configuration
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
  ];
  if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
  }

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow non-browser requests or same-origin server requests
      if (!origin) {
        cb(null, true);
        return;
      }

      // Check if origin matches allowed origins or local dev patterns
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error('Origin blocked by SubFlow CORS security policy'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Multipart upload
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // OpenAPI Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'SubFlow REST API',
        description: 'Complete Subscription Management and Recurring Billing Platform API',
        version: '1.0.0',
      },
      servers: [
        { url: 'http://localhost:4000', description: 'Local Development Server' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Custom Authentication Plugin
  await app.register(authPlugin);

  // Centralized Error Handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'SubFlow API',
    timestamp: new Date().toISOString(),
  }));

  // Register Business Modules
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(customerRoutes, { prefix: '/api/customers' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(planRoutes, { prefix: '/api/plans' });
  await app.register(quotationRoutes, { prefix: '/api/quotations' });
  await app.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
  await app.register(billingRoutes, { prefix: '/api/billing' });
  await app.register(invoiceRoutes, { prefix: '/api/invoices' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(discountRoutes, { prefix: '/api/discounts' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(portalRoutes, { prefix: '/api/portal' });
  await app.register(leakageRoutes, { prefix: '/api/leakage' });
  await app.register(simulatorRoutes, { prefix: '/api/simulator' });
  await app.register(recoveryRoutes, { prefix: '/api/recovery' });
  await app.register(csvImportRoutes, { prefix: '/api/csv-import' });
  await app.register(aiAssistantRoutes, { prefix: '/api/ai-assistant' });
  await app.register(auditRoutes, { prefix: '/api/audit' });

  return app;
}
