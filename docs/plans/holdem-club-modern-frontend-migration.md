# Holdem Club 新技术栈迁移实施方案

> **For Hermes:** 优先使用 Codex CLI 作为实现者。先按本方案完成可运行的新前端成品，再保留旧前端作为回退。执行时先保护当前未提交改动，不要覆盖现有手工修改。

**Goal:** 将当前 jQuery + Materialize 的德扑前端升级为一个可运行、可联通现有后端的现代化前端成品，优先解决首页质感一般、前端结构混乱、后续性能优化困难的问题。

**Architecture:** 采用 `Vite + React + TypeScript + Zustand + Tailwind + shadcn 风格组件` 新建独立前端目录 `frontend/`。第一阶段直接复用现有 Express + Socket.IO 后端协议，不先重写游戏规则；通过 API/Socket 适配层连接旧后端，实现“新前端可实际使用、旧前端保留回退”。

**Tech Stack:** Vite, React, TypeScript, Zustand, Tailwind CSS, socket.io-client v4（前端先兼容后端版本情况，必要时降到 v2-compatible client strategy）, Express static hosting or standalone dev server.

---

## 现状诊断

- 当前项目后端：`src/app.js` + `src/classes/game.js`
- 当前前端：`src/client/index.html` + `src/client/main.js` + `src/client/lobby_ui.js` + `src/client/css/index.css`
- 问题特征：
  - `src/client/main.js` 超大，包含 lobby、modal、牌桌渲染、socket 逻辑混杂
  - `src/client/css/index.css` 超大，视觉与状态样式耦合严重
  - 首页与牌桌页设计语言不统一
  - 旧技术栈不利于继续做性能和视觉升级
- 风险：仓库当前已有未提交改动，迁移时必须避免覆盖旧文件

---

## 目标交付物

本轮完成后应至少具备：

1. `frontend/` 新前端工程可独立安装、启动、构建
2. 新首页可用，视觉显著优于当前首页
3. 可创建房间、加入房间
4. 可进入新 Lobby / Table 基础界面
5. 能联通现有 Socket.IO 后端并显示基础状态
6. 旧前端仍保留，不破坏现有运行方式
7. 提供迁移说明文档，写明如何切换新旧前端

---

## 推荐目录结构

```text
frontend/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  postcss.config.js
  tailwind.config.ts
  src/
    main.tsx
    app/
      App.tsx
      router.tsx
      providers.tsx
    pages/
      landing/LandingPage.tsx
      room/RoomPage.tsx
      table/TablePage.tsx
    components/
      ui/
      branding/
      lobby/
      table/
      room/
    features/
      auth-placeholder/
      room/
      game/
      socket/
    stores/
      sessionStore.ts
      roomStore.ts
      gameStore.ts
      uiStore.ts
    lib/
      socket.ts
      format.ts
      constants.ts
      cn.ts
    styles/
      globals.css
  README.md
```

同时在仓库根目录新增：

```text
docs/plans/holdem-club-modern-frontend-migration.md
```

---

## 分阶段任务

### Task 1: 建立迁移方案文档

**Objective:** 把迁移目标、边界和结构固定下来，避免实现阶段跑偏。

**Files:**
- Create: `docs/plans/holdem-club-modern-frontend-migration.md`

**Implementation notes:**
- 文档包含目标、目录结构、阶段划分、验收标准、回退策略
- 明确“旧前端保留，新前端增量接入”

**Verification:**
- 读取文档，确认包含以上章节

---

### Task 2: 初始化 `frontend/` 新工程

**Objective:** 创建可运行的 Vite + React + TypeScript 前端骨架。

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/app/App.tsx`
- Create: `frontend/src/styles/globals.css`
- Create: `frontend/README.md`

**Implementation notes:**
- 使用 npm
- 脚本至少包含 `dev`、`build`、`preview`
- 不修改旧前端文件

**Verification:**
- `cd frontend && npm install`
- `cd frontend && npm run build`
- 预期：构建成功

---

### Task 3: 加入 Tailwind 与基础设计系统

**Objective:** 建立可复用的现代 UI 基础层。

**Files:**
- Create: `frontend/postcss.config.js`
- Create: `frontend/tailwind.config.ts`
- Modify: `frontend/src/styles/globals.css`
- Create: `frontend/src/lib/cn.ts`
- Create: `frontend/src/components/ui/button.tsx`
- Create: `frontend/src/components/ui/card.tsx`
- Create: `frontend/src/components/ui/badge.tsx`

**Implementation notes:**
- 不必完整引入 shadcn CLI，但组件风格参考 shadcn
- 色系要贴合扑克产品：深绿、暗金、象牙白
- 组件命名清晰

**Verification:**
- `cd frontend && npm run build`
- 检查产物无 Tailwind 编译错误

---

### Task 4: 实现新首页 Landing Page

**Objective:** 交付明显优于现有首页的新首页成品。

**Files:**
- Create: `frontend/src/pages/landing/LandingPage.tsx`
- Create: `frontend/src/components/branding/Hero.tsx`
- Create: `frontend/src/components/branding/FeatureStrip.tsx`
- Create: `frontend/src/components/branding/RoomEntryPanel.tsx`
- Modify: `frontend/src/app/App.tsx`

**Implementation notes:**
- 首页需有明确 CTA：创建牌桌、输入房码加入
- 视觉上克制、高级、非 PPT 感
- 文案精简，强调“房码组局、浏览器直连、实时同步”
- 先不用真弹窗，可先用 panel / drawer / inline form

**Verification:**
- `cd frontend && npm run build`
- 浏览器打开 dev server，检查首屏完整、按钮可交互

---

### Task 5: 建立房间与牌局状态 store

**Objective:** 把状态管理从旧式全局变量迁移到可维护结构。

**Files:**
- Create: `frontend/src/stores/sessionStore.ts`
- Create: `frontend/src/stores/roomStore.ts`
- Create: `frontend/src/stores/gameStore.ts`
- Create: `frontend/src/stores/uiStore.ts`
- Create: `frontend/src/lib/constants.ts`

**Implementation notes:**
- 先只覆盖最小可用状态：用户名、房码、玩家列表、阶段、底池、顶注、手牌、公共牌
- 类型定义应集中管理

**Verification:**
- `cd frontend && npm run build`
- TypeScript 无类型错误

---

### Task 6: 实现 Socket 适配层

**Objective:** 让新前端可联通现有后端事件，不立刻重写后端协议。

**Files:**
- Create: `frontend/src/lib/socket.ts`
- Create: `frontend/src/features/socket/useSocketLifecycle.ts`
- Create: `frontend/src/features/room/roomApi.ts`
- Create: `frontend/src/features/game/gameEvents.ts`

**Implementation notes:**
- 先兼容当前后端事件：`host`、`join`、`hostRoom`、`joinRoom`、`gameBegin`、`displayPossibleMoves` 等
- 若 Socket.IO v4 client 与 v2 server 兼容有问题，优先用兼容方案保证跑通
- 在适配层做 payload 正规化，不把旧协议污染整个 React 组件层

**Verification:**
- 本地运行前后端后，能成功建立 socket 连接
- 浏览器控制台无明显连接错误

---

### Task 7: 实现新 Lobby 页面

**Objective:** 完成创建房间/加入房间后的新房间页。

**Files:**
- Create: `frontend/src/pages/room/RoomPage.tsx`
- Create: `frontend/src/components/room/RoomHeader.tsx`
- Create: `frontend/src/components/room/PlayerList.tsx`
- Create: `frontend/src/components/room/RoomSettingsCard.tsx`
- Create: `frontend/src/components/room/StartGamePanel.tsx`

**Implementation notes:**
- 显示房码、房主、玩家列表、盲注/买入信息
- 房主可见操作区域，非房主只看状态
- 不必一次做全编辑能力，但至少要展示配置

**Verification:**
- 创建房间后页面可显示房间信息
- 加入房间后第二个玩家可看到同步列表

---

### Task 8: 实现新 Table 基础页面

**Objective:** 交付可用的新牌桌界面壳层。

**Files:**
- Create: `frontend/src/pages/table/TablePage.tsx`
- Create: `frontend/src/components/table/TableSurface.tsx`
- Create: `frontend/src/components/table/CommunityCards.tsx`
- Create: `frontend/src/components/table/PlayerSeat.tsx`
- Create: `frontend/src/components/table/SelfHandPanel.tsx`
- Create: `frontend/src/components/table/ActionBar.tsx`
- Create: `frontend/src/components/table/PotSummary.tsx`

**Implementation notes:**
- 第一版先把结构、信息层级和视觉统一起来
- 动作区至少支持弃牌/过牌/跟注/下注/加注按钮占位与基础联动
- 先追求可用、清晰、好看，不追求复杂动画

**Verification:**
- 游戏开始后能进入牌桌视图
- 可看到玩家基础信息、公共牌区、底池与阶段信息

---

### Task 9: 增加本地开发接入与切换说明

**Objective:** 让新旧前端都可运行，便于逐步迁移。

**Files:**
- Modify: `README.md`
- Create or Modify: `frontend/README.md`
- Optionally Create: `docs/frontend-migration-notes.md`

**Implementation notes:**
- 写明：如何启动旧后端 + 新前端
- 写明端口、代理或 socket 连接地址
- 写明当前已支持能力与未完成能力

**Verification:**
- 文档步骤能被实际执行

---

### Task 10: 端到端验收

**Objective:** 确认“成品”达到最小可交付标准。

**Files:**
- No required new files unless needed for fixes

**Checklist:**
- [ ] `frontend` 安装成功
- [ ] `frontend` 构建成功
- [ ] 首页成品明显优于旧版
- [ ] 可创建房间
- [ ] 可加入房间
- [ ] 可进入房间页
- [ ] 可进入牌桌基础页
- [ ] 不破坏旧前端

**Verification commands:**
- `cd frontend && npm install`
- `cd frontend && npm run build`
- `npm test`（如现有测试仍可跑则补跑）

---

## 实施策略

### 原则
- 不覆盖旧前端
- 优先新增 `frontend/`，以并行方式迁移
- 先打通主链路，再补高级交互
- 保持后端规则逻辑暂时不动

### 风险控制
- 当前仓库有未提交改动，所有实现都尽量局限在 `frontend/` 和文档目录
- 若必须改后端，只做最小桥接并单独标注
- 如果本地 3000 端口占用，先查占用进程，避免误判为代码问题

### 验收标准
- 用户可直接看到一个现代化的新首页与新牌桌雏形成品
- 不是只给方案，而是仓库里有可运行新工程

---

## Codex 执行提示词建议

```text
You are editing the /tmp/hermes-gh/holdem-club repo. First inspect the uncommitted working tree and preserve all existing manual work. Do not overwrite the old src/client implementation. Implement a new modern frontend in frontend/ using Vite + React + TypeScript + Zustand + Tailwind. Reuse the existing backend/socket protocol for now. Deliver a runnable MVP with: 1) landing page, 2) create/join room flow shell, 3) room page, 4) table page shell, 5) docs for how to run it. Prefer small targeted edits. Run lightweight verification (npm install/build in frontend). Do not commit.
```
