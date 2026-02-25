# GridTrax 🎬

![GridTrax Banner](public/bangumi_track.png)

**GridTrax** 是一个现代、精美且纯粹的前端私有影视剧集进度追踪应用。不仅能像传统的看剧记录工具一样管理您的观影状态，还能以“网格化”（Grid）视图直观展示每一集的观看进度。

## 🌟 项目动机

**GridTrax** 的核心灵感来源于广受好评的国内动漫二次元社区 [**Bangumi (番组计划)**](https://bgm.tv/)。

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

由于这是一个前端项目，它的部署极其简单。您可以将其直接部署在任何静态网页托管服务上（如 Vercel, Cloudflare Pages），或使用 Docker 部署在您自己的 VPS 上。

### 准备工作：获取 TMDB API Key
1. 注册并登录 [TMDB](https://www.themoviedb.org/)。
2. 进入 Account Settings -> API，申请一个 API Key (v4 auth - API Read Access Token)。
3. 获取到一长串的 `Bearer Token`。

### 方式一：一键部署 (推荐)

项目内置了 `deploy.sh` 脚本，可自动完成构建与运行：

```bash
# 赋予执行权限
chmod +x deploy.sh
# 运行脚本
./deploy.sh
```
脚本会自动从 `.env.local` 读取 Token，并引导您选择是否开启 SSL。

---

### 方式二：手动 Docker 部署 (VPS 用户)

如果您想手动控制过程：

```bash
docker build --build-arg VITE_TMDB_BEARER="你的_BEARER_TOKEN" -t gridtrax .
docker run -d --name gridtrax -p 0721:721 gridtrax
```
启动后在浏览器访问 `http://<您的IP>:0721` 即可。

> **提示**：如果您想在本地电脑 build 好镜像再传到云主机，可以使用 `docker save gridtrax | gzip > gridtrax.tar.gz` 导出，并通过 `scp` 上传再 `docker load`。

### 方式二：本地开发 & Node.js 源码部署

1. **克隆项目并安装依赖**：
   ```bash
   git clone https://github.com/yourusername/GridTrax.git
   cd GridTrax
   npm install
   ```
2. **配置环境变量**：
   在根目录创建 `.env.local` 文件，并填入您的 TMDB Token：
   ```env
   VITE_TMDB_BEARER=您的超长BearerToken
   ```
3. **启动开发服务器**：
   ```bash
   npm run dev
   ```
4. **编译为静态文件 (用于生产环境部署)**：
   ```bash
   npm run build
   ```
   编译后，`dist/` 文件夹即可直接丢进 Nginx/Apache 或任何静态托管平台。配置 Nginx 时别忘了加上 `try_files $uri $uri/ /index.html;` 来解决客户端路由 404 问题。

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
