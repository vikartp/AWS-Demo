# ============================================
# DocuMind Frontend - Development Dockerfile
# ============================================
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./

# Copy frontend package.json
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code and config only
COPY packages/frontend/tsconfig.json ./packages/frontend/
COPY packages/frontend/vite.config.ts ./packages/frontend/
COPY packages/frontend/tailwind.config.ts ./packages/frontend/
COPY packages/frontend/postcss.config.js ./packages/frontend/
COPY packages/frontend/index.html ./packages/frontend/
COPY packages/frontend/public/ ./packages/frontend/public/
COPY packages/frontend/src/ ./packages/frontend/src/

WORKDIR /app/packages/frontend

EXPOSE 5173

CMD ["pnpm", "dev"]
