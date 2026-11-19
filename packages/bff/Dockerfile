# ============================================
# DocuMind BFF - Development Dockerfile
# ============================================
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy package.json for all workspace packages needed
COPY packages/shared/package.json ./packages/shared/
COPY packages/bff/package.json ./packages/bff/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code and config only
COPY tsconfig.base.json ./
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src/ ./packages/shared/src/
COPY packages/bff/tsconfig.json ./packages/bff/
COPY packages/bff/src/ ./packages/bff/src/

WORKDIR /app/packages/bff

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["pnpm", "dev"]
