# ==============================================================================
# SubFlow Web Frontend Dockerfile (Next.js 15 App Router)
# ==============================================================================

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

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
# Development Target (Fast Refresh Hot Reloading)
# ==============================================================================
FROM deps AS dev
WORKDIR /app

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm --workspace=@subflow/shared run build

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "--workspace=@subflow/web", "run", "dev"]

# ==============================================================================
# Production Builder Target
# ==============================================================================
FROM deps AS builder
WORKDIR /app

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm --workspace=@subflow/shared run build

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm --workspace=@subflow/web run build

# ==============================================================================
# Production Runtime Target
# ==============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps /app/package.json /app/package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/web ./apps/web

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["npm", "--workspace=@subflow/web", "run", "start"]
