FROM node:20-alpine AS development

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/worker/package.json ./packages/worker/

RUN pnpm install --frozen-lockfile || pnpm install

COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/worker/ ./packages/worker/

WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/packages/worker

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3004/health || exit 1

CMD ["pnpm", "dev"]
