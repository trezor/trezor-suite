# ── Build stage ─────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare yarn@4 --activate

WORKDIR /app

# Copy workspace root + yarn config first for layer caching
COPY package.json yarn.lock* .yarnrc.yml ./
COPY tsconfig.base.json ./

# Copy all workspace packages (needed for resolution)
COPY packages/ packages/
COPY apps/ apps/

# Install dependencies and build
RUN yarn install
RUN yarn run build

# ── Production stage ───────────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare yarn@4 --activate

WORKDIR /app

COPY package.json yarn.lock* .yarnrc.yml ./
COPY packages/ packages/
COPY apps/ apps/

RUN yarn workspaces focus --all --production || yarn install

# Copy compiled output from builder
COPY --from=builder /app/packages/shared-types/dist packages/shared-types/dist
COPY --from=builder /app/packages/graph-service/dist packages/graph-service/dist
COPY --from=builder /app/packages/session-store/dist packages/session-store/dist
COPY --from=builder /app/apps/trezor-hive-memory/dist apps/trezor-hive-memory/dist

# Copy static Admin UI assets (no build step needed)
COPY apps/trezor-hive-memory/public apps/trezor-hive-memory/public

USER node

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

CMD ["node", "apps/trezor-hive-memory/dist/server.js"]
