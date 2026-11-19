# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files needed for install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# ============================================
# Stage 2: Development
# ============================================
FROM node:20-alpine AS development

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/backend/node_modules ./packages/backend/node_modules

# Copy source code
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/packages/backend

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3   CMD wget -qO- http://localhost:3001/health || exit 1

# Start in dev mode
CMD ["pnpm", "dev"]
