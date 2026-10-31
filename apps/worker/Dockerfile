# ==============================================================================
# SubFlow Autonomous Billing Worker Dockerfile (Multi-stage)
# ==============================================================================

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json tsconfig.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# ==============================================================================
# Development Target
# ==============================================================================
FROM deps AS dev
WORKDIR /app

COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm --workspace=@subflow/shared run build

ENV NODE_ENV=development

CMD ["npm", "--workspace=@subflow/worker", "run", "dev"]

# ==============================================================================
# Production Builder Target
# ==============================================================================
FROM deps AS builder
WORKDIR /app

COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/worker ./apps/worker

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm --workspace=@subflow/shared run build
RUN npm --workspace=@subflow/worker run build

# ==============================================================================
# Production Runtime Target
# ==============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/package.json /app/package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json

RUN chown -R node:node /app

USER node

CMD ["node", "apps/worker/dist/worker.js"]
