FROM node:20-alpine AS development

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/mock-ai/package.json ./packages/mock-ai/

RUN pnpm install --frozen-lockfile || pnpm install

COPY packages/mock-ai/ ./packages/mock-ai/

WORKDIR /app/packages/mock-ai

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["pnpm", "dev"]
