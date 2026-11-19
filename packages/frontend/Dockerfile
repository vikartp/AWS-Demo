FROM node:20-alpine AS development

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/frontend/package.json ./packages/frontend/

RUN pnpm install --frozen-lockfile || pnpm install

COPY packages/frontend/ ./packages/frontend/

WORKDIR /app/packages/frontend

EXPOSE 5173

CMD ["pnpm", "dev"]
