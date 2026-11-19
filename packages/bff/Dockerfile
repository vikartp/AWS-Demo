# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/bff/package.json ./packages/bff/

RUN pnpm install --frozen-lockfile || pnpm install

# ============================================
# Stage 2: Development
# ============================================
FROM node:20-alpine AS development

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/bff/node_modules ./packages/bff/node_modules

COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/bff/ ./packages/bff/

WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/packages/bff

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["pnpm", "dev"]
