# ============================================
# DocuMind Mock AI - Development Dockerfile
# ============================================
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy mock-ai package.json
COPY packages/mock-ai/package.json ./packages/mock-ai/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code and config only
COPY tsconfig.base.json ./
COPY packages/mock-ai/tsconfig.json ./packages/mock-ai/
COPY packages/mock-ai/src/ ./packages/mock-ai/src/

WORKDIR /app/packages/mock-ai

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["pnpm", "dev"]
