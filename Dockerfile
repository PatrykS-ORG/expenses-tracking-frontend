# ============================================
# STAGE 1: Builder
# ============================================
FROM node:24.16.0-alpine AS builder

ARG APP_VERSION
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_FEATURE_NEXTCLOUD

ENV APP_VERSION=${APP_VERSION} \
    CI=true \
    HUSKY=0 \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_API_URL=${VITE_API_URL} \
    VITE_FEATURE_NEXTCLOUD=${VITE_FEATURE_NEXTCLOUD}
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production

RUN pnpm build

# ============================================
# STAGE 2: Production Runner
# ============================================
FROM nginx:1.27-alpine AS runner

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
