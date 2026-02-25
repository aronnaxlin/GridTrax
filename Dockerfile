# ============================================================
# GridTrax — Multi-stage Dockerfile
# ============================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

# 1) 先复制依赖清单，利用 Docker 缓存层
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# 2) 复制源码并构建
COPY . .

ARG VITE_TMDB_BEARER
ENV VITE_TMDB_BEARER=${VITE_TMDB_BEARER}

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:1.27-alpine

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 复制两套 nginx 配置
COPY deploy/nginx/http.conf /etc/nginx/templates/nginx-http.conf
COPY deploy/nginx/ssl.conf  /etc/nginx/templates/nginx-ssl.conf

# 根据 ENABLE_SSL build-arg 决定使用哪套配置
ARG ENABLE_SSL=false
RUN if [ "$ENABLE_SSL" = "true" ]; then \
    cp /etc/nginx/templates/nginx-ssl.conf /etc/nginx/conf.d/default.conf; \
    else \
    cp /etc/nginx/templates/nginx-http.conf /etc/nginx/conf.d/default.conf; \
    fi && \
    rm -rf /etc/nginx/templates

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:721/ || exit 1

EXPOSE 721

CMD ["nginx", "-g", "daemon off;"]
