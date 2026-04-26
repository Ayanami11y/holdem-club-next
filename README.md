# Holdem Club Next

现代化前端重构试验仓库。

## 目标

- 保留旧版 `holdem-club` 作为参考
- 在这个仓库里独立推进新前端
- 技术栈：Vite + React + TypeScript + Zustand + Tailwind
- 第一阶段先复用旧后端 Socket.IO 协议，打通首页 / 房间 / 牌桌壳层

## 开发

### 1. 启动旧后端

在原仓库 `holdem-club` 里运行：

```bash
npm install
npm start
```

默认端口：`3000`

### 2. 启动新前端

```bash
cd frontend
npm install
npm run dev
```

默认端口：`5173`

Vite 已代理 `/socket.io` 到 `http://127.0.0.1:3000`。

## 当前完成度

- 新 Landing 页面
- 创建/加入房间入口
- Room 页面基础信息
- Table 页面基础壳层
- Zustand 状态管理基础
- Socket.IO v2 客户端适配

## 下一步建议

- 完整同步 host/join/game state payload
- 补全下注/加注金额面板
- 加入断线恢复与错误提示
- 将旧后端协议逐步类型化
