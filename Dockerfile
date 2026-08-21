# syntax=docker/dockerfile:1

# This is a pnpm project. Building with npm would resolve a different
# dependency tree than the one that is tested, so the build uses pnpm via
# corepack (bundled with Node 22).

# Node 22 is the floor, not a preference: @supabase/supabase-js 2.112 and its
# transitive packages declare engines >=22.0.0. The browser supplies its own
# WebSocket, so this is a build-time constraint here rather than the runtime
# crash it causes in the API. Keep in sync with package.json engines, .nvmrc
# and CI.

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite bakes VITE_* variables in at build time, so they must be present here
# rather than at runtime. Pass them with --build-arg.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_BACKEND_URL
ARG VITE_RZPY_KEYID
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT
ARG VITE_APP_VERSION
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_RZPY_KEYID=$VITE_RZPY_KEYID \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT \
    VITE_APP_VERSION=$VITE_APP_VERSION

RUN pnpm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
