# River Club Runtime Ports

## 唯一主运行仓库

当前唯一应运行的仓库是：

- `/tmp/hermes-gh/holdem-club-next`

旧仓库：

- `/tmp/hermes-gh/holdem-club`

只保留参考价值，不应再作为日常启动入口。

## 正式部署端口约定

- 正式入口（HTTPS）：`443`
- 后端本地监听：`3001`
- 开发态前端（仅本地调试）：`3000`

## 正式部署结构

### 前端
- 通过 `frontend/dist` 构建产物发布
- 由 **Nginx 直接托管静态资源**
- 用户正式访问入口：`https://ayanami11y.cloud`

### 后端
- Node 服务监听 `3001`
- Nginx 将以下路径反代到 `127.0.0.1:3001`
  - `/api`
  - `/socket.io`

## 正式启动方式

### 1) 构建前端
```bash
cd /tmp/hermes-gh/holdem-club-next/frontend
npm run build
```

### 2) 启动后端
```bash
cd /tmp/hermes-gh/holdem-club-next
PORT=3001 npm start
```

### 3) 重新加载 Nginx（如前端产物或站点配置更新）
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 开发模式

仅在本地调试前端热更新时使用：

```bash
cd /tmp/hermes-gh/holdem-club-next/frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

开发态 `3000` 不再作为正式域名入口依赖。

## 验证

### 正式首页
- `https://ayanami11y.cloud`

### 本机 HTTPS 验证
```bash
curl -k -I https://127.0.0.1 -H 'Host: ayanami11y.cloud'
```

### 后端健康检查
```bash
curl http://127.0.0.1:3001/api/health
```

### 后端状态检查
```bash
curl http://127.0.0.1:3001/api/status
```

## 原则

- 正式环境优先走 **Nginx 静态托管 + Node API/socket**
- 不再依赖 Vite dev server 托管线上 443
- 若再次出现 502，先检查：
  1. `3001` 后端是否存活
  2. Nginx 配置与 reload 是否成功
  3. `/api/health` 是否正常返回
