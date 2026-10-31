# ==============================================================================
# SubFlow REST API Dockerfile (Multi-stage: Development & Production)
# ==============================================================================

# Stage 1: Base Alpine image with required OpenSSL & libc libraries for Prisma
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Stage 2: Dependencies installer for npm workspace monorepo
FROM base AS deps
WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json tsconfig.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

# Install all monorepo dependencies
RUN npm ci

# ==============================================================================
# Development Target (Supports bind mounts & tsx watch hot-reloading)
# ==============================================================================
FROM deps AS dev
WORKDIR /app

# Copy packages and API source code
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY scripts ./scripts

# Generate Prisma Client and build shared utilities
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm --workspace=@subflow/shared run build

ENV NODE_ENV=development
ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000

# Safe startup: verify DB connectivity, execute migrations/seed, start API
CMD ["sh", "-c", "node scripts/docker-init-db.js && npm --workspace=@subflow/api run dev"]

# ==============================================================================
# Production Builder Target (Compiles TypeScript & builds production artifacts)
# ==============================================================================
FROM deps AS builder
WORKDIR /app

COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma Client and compile packages
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm --workspace=@subflow/shared run build
RUN npm --workspace=@subflow/api run build

# ==============================================================================
# Production Runtime Target (Minimal footprint, non-root user)
# ==============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Copy root dependencies and compiled application
COPY --from=deps /app/package.json /app/package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY scripts ./scripts

# Set ownership to unprivileged node user
RUN chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
