FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile=false --ignore-scripts

FROM dependencies AS build
COPY . .
RUN pnpm rebuild argon2 prisma @prisma/client \
  && pnpm db:generate \
  && pnpm --filter @sticker-track/shared build \
  && pnpm --filter @sticker-track/database build \
  && pnpm --filter @sticker-track/api build \
  && CI=true pnpm install --prod --ignore-scripts

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs \
  && adduser -S stickertrack -G nodejs
COPY --from=build --chown=stickertrack:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=stickertrack:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=stickertrack:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=stickertrack:nodejs /app/packages/database ./packages/database
COPY --from=build --chown=stickertrack:nodejs /app/packages/shared ./packages/shared
USER stickertrack
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health/live >/dev/null || exit 1
CMD ["sh", "-c", "cd packages/database && ./node_modules/.bin/tsx scripts/deploy-migrate.ts && cd /app && node apps/api/dist/main.js"]
