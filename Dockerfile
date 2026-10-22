# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

RUN mkdir -p dist/shared/cert \
    && cp src/shared/cert/globalsign-r6.pem dist/shared/cert/

RUN ls . && sleep 3

FROM node:22-bookworm-slim

RUN corepack enable
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_EXTRA_CA_CERTS=/app/dist/shared/cert/globalsign-r6.pem

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

CMD ["pnpm", "run", "start"]
