# River Club

River Club 是一套多人实时德州扑克项目。这个新仓库承载前端现代化和后端渐进重构，避免继续污染老仓库。

## 仓库定位

- 老仓库：`/tmp/hermes-gh/holdem-club`
- 新仓库：`/tmp/hermes-gh/holdem-club-next`
- 当前主运行仓库：`/tmp/hermes-gh/holdem-club-next`
- 当前正式入口：**https://ayanami11y.cloud**

## 当前架构

### 正式前端
- Vite + React + TypeScript + Zustand + Tailwind
- 通过 `frontend/dist` 构建产物发布
- 由 **Nginx 直接托管静态资源**
- 正式入口：`443 / https://ayanami11y.cloud`

### 后端
- Node + Express + Socket.IO 2.3
- 本地运行端口：`3001`
- Nginx 反代以下路径到后端：
  - `/api`
  - `/socket.io`
- 保持旧事件协议兼容：`host` / `join` / `updateRoomSettings` / `startGame` / `moveMade`
- 新增健康检查：`GET /api/health`
- 新增状态检查：`GET /api/status`

### 开发模式
- 开发态前端端口：`3000`
- 仅在本地调试热更新时使用
- 不再作为正式域名入口依赖

## 后端结构升级

原来的入口已经拆成更清晰的模块：

- `src/server.js`：后端主启动入口
- `src/app.js`：装配入口
- `src/server/createApp.js`：创建 Express app
- `src/server/createSocketServer.js`：Socket.IO 事件注册与房间流程
- `src/server/registerSocketHandlers.js`：实时事件注册拆分
- `src/server/roomRegistry.js`：房间注册表与查找逻辑
- `src/server/services/roomService.js`：房间服务层
- `src/server/services/gameService.js`：牌局服务层
- `src/server/serializers/roomSerializer.js`：房间序列化
- `src/server/serializers/tableSerializer.js`：牌桌序列化
- `src/server/sanitizeRoomSettings.js`：房间配置清洗
- `src/server/healthRoutes.js`：健康检查接口
- `src/server/statusRoutes.js`：状态检查接口

这样做的目标是：
- 先把结构理顺
- 不重写牌局引擎
- 不破坏现有协议
- 给后续升级 Socket.IO 4.x / 类型化事件留出空间

## 正式部署

### 1) 构建前端
```bash
cd /tmp/hermes-gh/holdem-club-next/frontend
npm install
npm run build
```

### 2) 启动后端（3001）
```bash
cd /tmp/hermes-gh/holdem-club-next
PORT=3001 npm start
```

### 3) 检查并重载 Nginx
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 开发运行

仅用于本地调试：

### 启动前端 dev server（3000）
```bash
cd /tmp/hermes-gh/holdem-club-next/frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

### 启动后端（3001）
```bash
cd /tmp/hermes-gh/holdem-club-next
PORT=3001 npm start
```

浏览器本地开发入口：

```text
http://127.0.0.1:3000
```

## 验证

### 正式首页
```bash
curl -k -I https://127.0.0.1 -H 'Host: ayanami11y.cloud'
```

预期返回：
- `HTTP/1.1 200 OK`

### 健康检查
```bash
curl http://127.0.0.1:3001/api/health
```

预期返回类似：

```json
{
  "ok": true,
  "app": "River Club",
  "port": 3001,
  "rooms": 0
}
```

### 状态检查
```bash
curl http://127.0.0.1:3001/api/status
```

## 下一步

- 打通创建房间 → 房码回填 → 开局 → 桌面状态同步
- 补全 host / join / room / game payload 类型
- 升级 Socket.IO 4.x，并做兼容迁移
- 拆解 `Game` 核心逻辑，逐步走向更干净的 domain/service 结构
- 继续提升牌桌 UI、动画反馈和性能表现
