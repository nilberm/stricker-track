FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile=false --ignore-scripts

FROM dependencies AS build
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ARG NEXT_PUBLIC_BUY_ME_A_COFFEE_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BUY_ME_A_COFFEE_URL=$NEXT_PUBLIC_BUY_ME_A_COFFEE_URL
RUN pnpm rebuild sharp \
  && pnpm --filter @sticker-track/shared build \
  && pnpm --filter @sticker-track/web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S stickertrack -G nodejs
COPY --from=build --chown=stickertrack:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=stickertrack:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=stickertrack:nodejs /app/apps/web/public ./apps/web/public
USER stickertrack
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/pt-BR >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
