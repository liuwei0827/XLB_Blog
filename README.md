# 🥟 十块钱小笼包博客

> 记录平凡生活里的温暖味道，探寻城市角落里的感动瞬间。

一个基于 **Node.js + Vanilla JS (ES Modules)** 的现代前后端分离博客项目，无框架依赖，强调代码可读性与可维护性。

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 📝 文章管理 | Markdown 渲染、分类、标签、封面图 |
| 🔍 全文搜索 | 标题、摘要、正文三字段搜索 |
| 🏷️ 分类与标签 | 分类筛选 + 标签页跳转 |
| 💬 评论系统 | 用户评论，无需注册 |
| ❤️ 点赞功能 | 一键点赞文章 |
| 📚 归档页 | 按年份分组展示所有文章 |
| 🔐 管理后台 | 登录认证、增删文章与分类 |
| 📱 响应式设计 | 适配移动端、平板、桌面 |

---

## 🗂️ 项目结构

```
xlb-blog/
├── client/                     # 前端（纯静态，ES Modules）
│   ├── index.html              # SPA 入口
│   ├── css/
│   │   └── style.css           # 全局样式
│   └── js/
│       ├── app.js              # 应用入口，初始化所有模块
│       ├── router.js           # 客户端路由（History API）
│       ├── store.js            # 轻量全局状态管理（发布/订阅）
│       ├── api.js              # 统一 API 请求封装层
│       ├── utils.js            # 纯工具函数（格式化、转义等）
│       ├── components/
│       │   ├── header.js       # 顶部导航栏
│       │   ├── search.js       # 搜索浮层
│       │   └── footer.js       # 页脚分类列表
│       └── pages/
│           ├── home.js         # 首页
│           ├── post.js         # 文章详情页
│           ├── archive.js      # 归档页
│           ├── about.js        # 关于页
│           └── admin.js        # 管理后台
│
├── server/                     # 后端（Node.js + Express）
│   ├── index.js                # 启动入口（仅负责 listen）
│   ├── app.js                  # Express 应用配置（中间件、路由注册）
│   ├── config/
│   │   └── index.js            # 统一配置（读取环境变量）
│   ├── db/
│   │   ├── index.js            # 数据库连接（better-sqlite3）
│   │   ├── schema.js           # 建表语句与索引定义
│   │   └── seed.js             # 初始化示例数据
│   ├── middleware/
│   │   ├── auth.js             # requireAuth 中间件
│   │   ├── logger.js           # 请求日志中间件
│   │   └── errorHandler.js     # 全局错误处理中间件
│   ├── controllers/            # 业务逻辑层
│   │   ├── postController.js
│   │   ├── categoryController.js
│   │   ├── commentController.js
│   │   └── authController.js
│   └── routes/
│       ├── index.js            # 路由聚合（统一注册入口）
│       ├── posts.js
│       ├── categories.js
│       ├── comments.js
│       └── auth.js
│
├── data/                       # SQLite 数据库文件（gitignored）
├── uploads/                    # 上传文件（gitignored）
├── .env                        # 环境变量（gitignored）
├── .env.example                # 环境变量模板
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，修改 SESSION_SECRET 等配置
```

### 3. 初始化数据库

```bash
npm run seed
```

### 4. 启动服务

```bash
# 开发模式（文件变更自动重启）
npm run dev

# 生产模式
npm start
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 🔐 管理后台

| 地址 | http://localhost:3000/admin |
|------|------|
| 默认账号 | `admin` |
| 默认密码 | `admin123` |

> ⚠️ 正式部署前请修改密码并更新 `.env` 中的 `SESSION_SECRET`

---

## 📡 API 文档

### 文章

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/posts` | 列表（`?page=1&limit=6&category=slug&search=kw&tag=xxx`）|
| GET | `/api/posts/featured` | 热门精选（Top 3）|
| GET | `/api/posts/:slug` | 文章详情 + 评论 + 相关推荐 |
| POST | `/api/posts` | 新建文章（需登录）|
| PUT | `/api/posts/:id` | 更新文章（需登录）|
| DELETE | `/api/posts/:id` | 删除文章（需登录）|
| POST | `/api/posts/:id/like` | 点赞 |

### 分类

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 分类列表（含文章计数）|
| POST | `/api/categories` | 新建分类（需登录）|
| DELETE | `/api/categories/:id` | 删除分类（需登录）|

### 评论

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/comments/:postId` | 文章评论列表 |
| POST | `/api/comments` | 发表评论 |
| DELETE | `/api/comments/:id` | 删除评论（需登录）|

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 退出 |
| GET | `/api/auth/check` | 检查登录状态 |

---

## 🏗️ 架构说明

### 后端分层

```
HTTP 请求
  → 中间件（logger → session → errorHandler）
  → 路由（routes/index.js 聚合）
  → 控制器（business logic）
  → 数据库（better-sqlite3）
```

### 前端分层

```
app.js（入口，初始化）
  → router.js（URL → 页面映射）
  → pages/*.js（页面渲染逻辑）
  → components/*.js（可复用 UI 组件）
  → api.js（所有网络请求）
  → store.js（全局状态：分类、登录态）
  → utils.js（纯函数工具）
```

### 关键设计决策

- **无构建工具**：使用 ES Modules 原生浏览器支持，无需 Webpack/Vite，降低维护成本
- **SQLite**：轻量、零依赖、文件即数据库，适合个人博客规模
- **控制器与路由分离**：`routes/` 只做路径与方法的映射，业务逻辑全在 `controllers/`
- **单一配置源**：所有配置通过 `server/config/index.js` 集中读取，避免硬编码

---

## 🔧 扩展指南

### 添加新 API 接口

1. 在 `server/controllers/` 新建或修改控制器
2. 在 `server/routes/` 添加路由
3. 在 `server/routes/index.js` 注册（如新增路由文件）

### 添加新前端页面

1. 在 `client/js/pages/` 新建页面模块（导出 `render` 函数）
2. 在 `client/js/app.js` 导入并用 `addRoute()` 注册路径

### 引入构建工具（未来扩展）

项目结构已为引入 Vite 做好准备：
- 将 `client/` 作为 Vite 的 `root`
- 移除 CDN 的 marked.js，改为 `npm install marked`
- 修改 `server/app.js` 中静态资源路径指向 `dist/`

---

## 📦 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js >= 18 |
| 服务框架 | Express 4 |
| 数据库 | SQLite（better-sqlite3）|
| 认证 | express-session + bcryptjs |
| 前端渲染 | 原生 ES Modules |
| Markdown | marked.js（CDN）|
| 字体 | Google Fonts（Noto Serif SC / Noto Sans SC）|

---

## 📄 License

MIT
