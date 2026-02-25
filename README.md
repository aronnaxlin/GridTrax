# GridTrax 🎬

![GridTrax Banner](public/bangumi_track.png)

**GridTrax** 是一个现代、精美且纯粹的前端私有影视剧集进度追踪应用。不仅能像传统的看剧记录工具一样管理您的观影状态，还能以“网格化”（Grid）视图直观展示每一集的观看进度。

## 🌟 项目动机

**GridTrax** 的核心灵感来源于广受好评的动漫二次元社区 [**Bangumi (番组计划)**](https://bgm.tv/)。

本项目作为一个轻量级的个人练习与自用工具，旨在探索一种不同的 UI 呈现方式与数据存储模式：
1. **网格系统 (Grid View)**：对于包含多季内容或数十集的剧集/动漫，尝试用直观的方块网格来分别呈现每一集的独立状态，像打卡一样记录单集看番进度。
2. **纯前端架构**：由于仅作为个人记录工具，项目完全移除了后端服务依赖。所有的观影数据均保存在本地浏览器中。
3. **自带存储 (BYOS)**：支持通过标准 WebDAV 协议（配合您的私有 NAS 或云盘工具）进行跨设备的数据同步，确保个人的追剧数据完全掌握在自己手中。

---

## ✨ 核心特性

- 🎨 **Base46 动态主题**：内置多种精调的高级色彩主题（如 Ocean, Dracula, TokyoNight 等），随心切换。
- 🔍 **海量数据源支持**：集成 [TMDB API](https://www.themoviedb.org/)，提供极其丰富的全球影视/动漫元数据。
- 📊 **集数网格 (Episode Grid)**：为每一季的每一个单集生成独立网格，长按/点击即可轻松打卡。
- ☁️ **私密同步**：原生支持浏览器跨域 WebDAV 同步，并提供 JSON 文件一键导入导出。
- 📱 **响应式设计**：流畅支持桌面端和移动端浏览的操作体验。

---

## 🛠️ 技术栈

- **框架**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **UI 组件库**: [Material UI (MUI)](https://mui.com/) v7
- **状态管理**: [Zustand](https://zustand-demo.pmnd.rs/) (带 `persist` 持久化)
- **网络请求**: 原生 `fetch` (WebDAV) / `Axios` (TMDB)
- **色彩提取**: `colorthief` (智能提取海报主色调)

---

## 🚀 部署与使用教程

这是一个纯前端 SPA 项目，构建产物为静态文件。可部署在任何静态托管服务（Vercel, Cloudflare Pages）、Docker 或 Node.js 环境中。

### 准备工作：获取 TMDB API Key

1. 注册并登录 [TMDB](https://www.themoviedb.org/)。
2. 进入 Account Settings → API，申请一个 API Key (v4 auth - API Read Access Token)。
3. 在项目根目录创建 `.env.local` 文件：
   ```env
   VITE_TMDB_BEARER=您的超长BearerToken
   ```

---

### 方式一：Docker Compose 部署 (推荐)

```bash
# HTTP 模式
docker compose --env-file .env.local up -d --build

# HTTPS 模式 (需要 Let's Encrypt 证书)
### 🐳 Docker 部署 (推荐)

项目已针对 Docker 进行优化，支持一键部署到云服务器、群晖 NAS 等。镜像中**不包含**任何私密 Token，所有配置均在运行时动态注入。

#### 1. 使用 Docker Compose (最简单)

下载 `docker-compose.yml` 并运行：

```yaml
services:
  gridtrax:
    image: <your-username>/gridtrax:latest
    container_name: gridtrax
    ports:
      - "721:721"
    environment:
      # 方式 A：直接指定环境变量 (推荐)
      - VITE_TMDB_BEARER=您的_TMDB_V4_TOKEN
    volumes:
      # 方式 B：通过挂载的方式读取本地的 .env.local 文件
      - ./.env.local:/app/.env.local:ro
    restart: always
```

直接启动：
```bash
docker compose up -d
```

> [!TIP]
> **方式 C**：你也可以在部署时不提供任何 Token，直接在网页登录后的【同步设置】中填入 Token，点击保存即可实时生效。

#### 2. 自行构建并推送到 Docker Hub

如果你修改了代码并想分发自己的镜像：

```bash
# 构建镜像 (自动包含运行时注入逻辑)
docker build -t <your-username>/gridtrax:latest .

# 推送
docker login
docker push <your-username>/gridtrax:latest
```

> [!NOTE]
> **关于安全性**：项目使用“占位符替换”技术。构建镜像时，代码中的 Token 会被设为占位符。当容器启动时，`entrypoint.sh` 脚本会自动将占位符替换为运行时提供的环境变量或 `.env.local` 内容。这确保了你可以放心地将镜像上传到公共仓库。
---

### 方式二：一键脚本部署

```bash
chmod +x deploy.sh

./deploy.sh                  # HTTP 模式
./deploy.sh --ssl            # HTTPS 模式
./deploy.sh --port 8080      # 自定义端口
./deploy.sh --ssl --port 443 # HTTPS + 自定义端口
```

---

### 方式三：NPM 直接部署

无需 Docker，直接使用 Node.js（≥ 18）运行：

```bash
# 克隆并安装
git clone https://github.com/yourusername/GridTrax.git
cd GridTrax
npm install

# 配置 .env.local (见上方)

# 开发模式
npm run dev

# 构建 + 启动静态服务 (端口 721)
npm run serve

# 或者分步操作：先 build，再 start
npm run build
npm run start
```

> `dist/` 目录也可以直接丢进 Nginx/Apache/Caddy。使用 Nginx 时请配置 `try_files $uri $uri/ /index.html;` 以支持 SPA 路由。

---

### 手动 Docker 构建 (不使用 Compose)

```bash
docker build --build-arg VITE_TMDB_BEARER="你的_TOKEN" -t gridtrax .
docker run -d --name gridtrax -p 721:721 --restart unless-stopped gridtrax
```

> **提示**：离线传输镜像可使用 `docker save gridtrax | gzip > gridtrax.tar.gz`，远端执行 `docker load < gridtrax.tar.gz`。

---

## ☁️ 同步配置 (WebDAV)

由于 GridTrax 不自带后端，数据默认保存在浏览器的 LocalStorage 中（清除缓存会被清空）。若要安全保存并跨设备同步数据：
1. 点击导航栏右上角的 **"同步" (Sync)** 图标。
2. 填写您的 WebDAV 配置（推荐使用 [Alist](https://alist.nn.ci/) 挂载任何网盘，自带跨域支持）。
3. **注意：** 服务器**必须**支持并开启 CORS（跨域资源共享），否则浏览器会拒绝连接（坚果云原生不支持前端跨域，必须用 Alist 中转）。
4. 如果没有 WebDAV，您也可以使用面板中的 **导出 JSON / 导入 JSON** 功能进行手动备份。

---

## 🤝 贡献指南

欢迎任何形式的贡献！无论是一个小 Bug 的修复，还是全新特性的建议：
1. **Fork** 本仓库。
2. 创建您的 Feature 分支: `git checkout -b feature/AmazingFeature`。
3. 提交变更: `git commit -m 'Add some AmazingFeature'`。
4. 推送到分支: `git push origin feature/AmazingFeature`。
5. 提交一个 Pull Request。

建议在提大型 PR 前，先在 Issues 提出您的想法以供讨论。

---

## 📄 开源协议

GridTrax 基于 [MIT License](LICENSE) 协议开源。请自由享受并改造它！
