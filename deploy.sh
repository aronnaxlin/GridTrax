#!/bin/bash

# GridTrax 一键部署脚本

set -e

# 默认设置
CONTAINER_NAME="gridtrax"
IMAGE_NAME="gridtrax"
PORT="0721"

echo "🚀 开始 GridTrax 部署流程..."

# 1. 检查环境变量
if [ -f .env.local ]; then
    echo "📄 发现 .env.local，尝试从文件中读取 TMDB TOKEN..."
    BEARER=$(grep VITE_TMDB_BEARER .env.local | cut -d '=' -f2)
fi

if [ -z "$BEARER" ]; then
    read -p "❓ 未能从 .env.local 获取到 TOKEN，请输入 TMDB Bearer Token: " BEARER
fi

if [ -z "$BEARER" ]; then
    echo "❌ 错误: 必须提供 TMDB Token 才能构建。"
    exit 1
fi

# 2. 交互式选择 SSL
read -p "🔒 是否开启 HTTPS (SSL)? (y/n, 默认 n): " ENABLE_SSL
SSL_ARG="false"
IMAGE_TAG="latest"

if [[ "$ENABLE_SSL" == "y" || "$ENABLE_SSL" == "Y" ]]; then
    SSL_ARG="true"
    IMAGE_TAG="ssl"
    echo "✅ 已选择开启 SSL 模式。"
else
    echo "ℹ️ 已选择 HTTP 模式。"
fi

# 3. 停止并移除旧容器 (如果存在)
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "🛑 发现同名容器，正在停止并移除..."
    docker stop $CONTAINER_NAME > /dev/null
    docker rm $CONTAINER_NAME > /dev/null
fi

# 4. 构建镜像
echo "🛠️ 正在构建 Docker 镜像 ($IMAGE_NAME:$IMAGE_TAG)..."
docker build \
    --build-arg VITE_TMDB_BEARER="$BEARER" \
    --build-arg SSL="$SSL_ARG" \
    -t "$IMAGE_NAME:$IMAGE_TAG" .

# 5. 启动容器
echo "🚢 正在启动容器..."
if [[ "$SSL_ARG" == "true" ]]; then
    # SSL 模式需要挂载证书
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "$PORT:721" \
        -v /etc/letsencrypt:/etc/letsencrypt \
        --restart unless-stopped \
        "$IMAGE_NAME:$IMAGE_TAG"
    echo "✨ 部署成功！项目已运行在 https://你的域名:$PORT"
else
    # 普通 HTTP 模式
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p "$PORT:721" \
        --restart unless-stopped \
        "$IMAGE_NAME:$IMAGE_TAG"
    echo "✨ 部署成功！项目已运行在 http://你的IP:$PORT"
fi

echo "📝 使用 'docker logs $CONTAINER_NAME' 查看运行日志。"
