# Multi-stage Dockerfile for GridTrax

# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
ARG VITE_TMDB_BEARER
ENV VITE_TMDB_BEARER=$VITE_TMDB_BEARER

RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# 同时拷贝两个配置
COPY nginx.conf /etc/nginx/conf.d/nginx.conf
COPY nginx-ssl.conf /etc/nginx/conf.d/nginx-ssl.conf

# 根据 build-arg 来决定最终使用的配置
ARG SSL=false
RUN if [ "$SSL" = "true" ]; then \
    mv /etc/nginx/conf.d/nginx-ssl.conf /etc/nginx/conf.d/default.conf && \
    rm /etc/nginx/conf.d/nginx.conf; \
    else \
    mv /etc/nginx/conf.d/nginx.conf /etc/nginx/conf.d/default.conf && \
    rm /etc/nginx/conf.d/nginx-ssl.conf; \
    fi

EXPOSE 721
CMD ["nginx", "-g", "daemon off;"]
