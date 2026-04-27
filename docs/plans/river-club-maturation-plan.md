# River Club Maturation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 把 `/tmp/hermes-gh/holdem-club-next` 从“可运行 MVP”推进到“更成熟的多人德州扑克产品骨架”：统一新仓库为唯一主线，逐步升级后端架构、实时协议、画面表达与性能。

**Architecture:** 采用“单主仓库 + 渐进重构”路线：旧仓库停止承担运行职责，只保留参考价值；新仓库继续保留现有 Node/Express + Socket.IO 兼容层，但把服务端拆成 app / transport / domain / serializers / config 的清晰结构；前端继续走 Vite + React + Zustand，但补上真正的应用 shell、场景化组件、轻量性能基线与真实牌桌 UI。

**Tech Stack:** Node.js, Express, Socket.IO 2.x-compatible bridge (短期), React, TypeScript, Zustand, Tailwind, Vite, Jest（后端已有）, 浏览器开发者工具 / Lighthouse（后续）

---

## 当前上下文

### 路径
- 老仓库：`/tmp/hermes-gh/holdem-club`
- 新仓库：`/tmp/hermes-gh/holdem-club-next`

### 当前运行口径
- 前端：`3000`
- 后端：`3001`
- 浏览器入口：`http://127.0.0.1:3000`
- 健康检查：`http://127.0.0.1:3001/api/health`

### 已完成基础工作
- 老服务已不再是当前活跃服务来源；当前 3000/3001 活跃进程均来自新仓库。
- 新仓库已完成第一轮后端拆分：
  - `src/server/createApp.js`
  - `src/server/createSocketServer.js`
  - `src/server/roomRegistry.js`
  - `src/server/sanitizeRoomSettings.js`
  - `src/server/healthRoutes.js`
- 前端已可在浏览器中打开，首屏可见。

### 已知问题
- 后端仍是“事件直连 Game 实例”的薄服务层，缺少 serializer / snapshot / typed contract。
- 前端页面还偏 MVP，尚未形成成熟德扑游戏的“观感 + 操作 + 状态反馈”。
- 还没有性能基线、还没有 smoke test、还没有完整联机流验收。

---

## 产品方向：成熟德扑游戏应该具备什么

这一阶段的“成熟”先不追求全功能平台化，而先追求四件事：

1. **牌桌观感像样**
   - 不是表单页拼起来，而是进入房间就有明确的牌桌氛围、玩家座位、底池、行动提示、阶段信息。
2. **联机状态稳定且清楚**
   - 用户知道：当前是否已连接、房间是否存在、谁在行动、是否等待下一手。
3. **后端结构可继续演进**
   - 未来能自然支持断线恢复、观战、回放、AI bot、排行榜等，而不是继续往大泥球里塞代码。
4. **性能可控**
   - 减少不必要 rerender，控制 payload 粒度，给以后真机/移动端访问留空间。

---

## 实施阶段

## Phase 0：仓库治理与运行口径固化

### 目标
确保所有运行、文档、口径都指向新仓库，旧仓库不再被误启动。

### 任务
1. 在新仓库根目录新增运行说明文档：`docs/runbook/runtime-ports.md`
   - 说明：前端 3000、后端 3001、旧仓库仅参考。
2. 在旧仓库 `README.md` 顶部增加醒目说明：
   - “此仓库不再作为主运行入口，请改用 `/tmp/hermes-gh/holdem-club-next`”。
3. 如有需要，为新仓库增加脚本：
   - `npm run dev:backend`
   - `npm run dev:frontend`（写在根 README 即可，或者后续用并行脚本）
4. 清理新仓库里的旧命名残留：
   - `package-lock.json`
   - `docs/plans/holdem-club-modern-frontend-migration.md`（不一定要删，但要标注为历史迁移文档）

### 验收
- `search_files` 搜“Holdem Club Next”时，不再出现在用户可见主入口文案里。
- 任何人读 README 都知道新仓库才是运行入口。

---

## Phase 1：后端进入可演进结构

### 目标
把后端从“socket 事件直接操作大 Game 对象”推进到“有 transport / service / serializer 分层”的状态。

### 目标文件
- Create: `src/config/runtime.js`
- Create: `src/server/registerSocketHandlers.js`
- Create: `src/server/serializers/roomSerializer.js`
- Create: `src/server/serializers/tableSerializer.js`
- Create: `src/server/services/roomService.js`
- Create: `src/server/services/gameService.js`
- Modify: `src/server/createSocketServer.js`
- Modify: `src/app.js`

### 任务拆分
1. 抽运行时配置
   - 把端口、应用名集中到 `src/config/runtime.js`
2. 拆 socket handler 注册
   - `createSocketServer.js` 只负责创建 io
   - 事件注册交给 `registerSocketHandlers.js`
3. 增加 serializer
   - `roomSerializer.js`：统一输出房间状态
   - `tableSerializer.js`：统一输出牌桌/玩家/底池/阶段状态
4. 增加 service 层
   - `roomService.js`：host / join / updateRoomSettings 逻辑
   - `gameService.js`：startGame / moveMade / evaluatePossibleMoves 等
5. 在不破坏旧事件名的前提下，新增更干净的服务端发包结构
   - 短期可保留旧 event names
   - 但 payload 尽量通过 serializer 发出去
6. 追加新的只读接口
   - `GET /api/status`
   - 返回 app / port / rooms / activePlayers 基础摘要

### 验收
- `src/server/createSocketServer.js` 不再塞满全部业务逻辑。
- 至少 room / table 有统一 serializer 出口。
- `curl /api/health` 和 `curl /api/status` 都正常。

---

## Phase 2：实时协议升级到“前端好接”的状态

### 目标
让前端不再猜数据，开始拥有可依赖的 room / table snapshot。

### 目标文件
- Modify: `frontend/src/features/room/roomApi.ts`
- Modify: `frontend/src/features/game/gameEvents.ts`
- Modify: `frontend/src/stores/roomStore.ts`
- Modify: `frontend/src/stores/gameStore.ts`
- Create: `frontend/src/types/socket.ts`
- Create: `frontend/src/types/table.ts`

### 任务
1. 明确 room snapshot 结构
   - 房码、房主、玩家列表、盲注、buy-in、可否开始
2. 明确 table snapshot 结构
   - stage、pot、community cards、current actor、每位玩家 stack / bet / seat / folded / all-in
3. 在前端 store 中统一吸收 snapshot
4. 增加错误事件处理
   - 房间不存在
   - 重名失败
   - 非房主改设置失败
   - 开局失败
5. 增加连接状态标识
   - connecting / connected / reconnecting / disconnected

### 验收
- 前端不再到处散着猜 payload。
- 打开 DevTools 可以看到状态变化稳定可追。

---

## Phase 3：画面升级成“像德扑产品”

### 目标
把视觉从 MVP 页面壳升级成真正像样的桌游产品界面。

### 目标文件
- Modify: `frontend/src/pages/landing/LandingPage.tsx`
- Modify: `frontend/src/pages/room/RoomPage.tsx`
- Modify: `frontend/src/pages/table/TablePage.tsx`
- Create: `frontend/src/components/table/PokerTable.tsx`
- Create: `frontend/src/components/table/SeatRing.tsx`
- Create: `frontend/src/components/table/PlayerSeat.tsx`
- Create: `frontend/src/components/table/PotDisplay.tsx`
- Create: `frontend/src/components/table/ActionPanel.tsx`
- Create: `frontend/src/components/table/CommunityBoard.tsx`
- Modify: `frontend/src/styles/globals.css`

### 画面目标
1. Landing 页
   - 更高级、更克制，不像后台管理页
   - 强化“私人牌局 / 房码组局 / 浏览器即开局”
2. Room 页
   - 更像赛前大厅
   - 玩家列表、房主标识、盲注设置、开局按钮更清晰
3. Table 页
   - 深色桌面主题
   - 椭圆牌桌 / 玩家座位环 / 公共牌区 / 底池区 / 当前行动高亮
   - 操作面板固定且信息密度合理

### 视觉原则
- 不花哨，但要高级感
- 不要 PPT 感
- 主色偏深绿 / 金色点缀 / 黑金扑克俱乐部气质
- 用真正组件布局，不靠一堆 inline style 硬撑

### 验收
- 浏览器打开 Table 页面时，有明显“德扑桌面”感。
- 手机上至少保证不炸布局。

---

## Phase 4：性能与交互质量基线

### 目标
把性能问题提前控制住，不等页面做复杂了再返工。

### 目标文件
- Modify: `frontend/src/stores/*`
- Modify: `frontend/src/components/table/*`
- Create: `frontend/src/lib/selectors.ts`
- Create: `docs/perf/baseline.md`

### 任务
1. Zustand selector 化
   - 避免大对象全量订阅导致整页 rerender
2. 玩家座位组件 memo 化
3. 公共牌 / 底池 / action panel 拆成稳定子树
4. 记录一次 baseline
   - build 产物大小
   - 首页加载体感
   - Table 页面交互时是否掉帧
5. 后端基础性能梳理
   - 减少重复 emit
   - 避免 room 查找过多重复扫描（后续可引入 Map）

### 验收
- 前端 build 体积和关键页面 rerender 行为有记录。
- 主要组件不是一动全页刷。

---

## Phase 5：联机体验闭环

### 目标
真正把“创建房间 → 加入房间 → 开局 → 行动 → 下一手”走通，并形成回归检查。

### 目标文件
- Create: `docs/qa/manual-smoke-test.md`
- Optional: 新增轻量自动化 smoke 脚本

### 任务
1. 整理手工 smoke 流程
   - host
   - join
   - start game
   - fold/check/call/raise
   - next round
2. 修复实际联调中发现的 payload / UI / 状态 bug
3. 如条件允许，补一个最轻量的浏览器联机 smoke test

### 验收
- 至少一轮完整多玩家路径被验证通过。

---

## 我建议的执行优先级

### 先做（最高价值）
1. Phase 1：后端 service / serializer 拆层
2. Phase 2：snapshot 与前端状态打通
3. Phase 3：Table 页面视觉升级

### 再做
4. Phase 4：性能基线
5. Phase 5：联机闭环验收

---

## 本轮立刻可执行的实现范围

如果直接继续干，不停留在计划层，我建议下一轮落地这组最值任务：

1. `src/config/runtime.js`
2. `src/server/registerSocketHandlers.js`
3. `src/server/services/roomService.js`
4. `src/server/services/gameService.js`
5. `src/server/serializers/roomSerializer.js`
6. `src/server/serializers/tableSerializer.js`
7. `GET /api/status`
8. 前端新增连接状态 + room/table snapshot store 适配
9. Table 页面做第一版“真牌桌布局”升级

这组做完，项目会从“能看”明显进到“更像产品”的阶段。

---

## 验证命令

### 后端
```bash
cd /tmp/hermes-gh/holdem-club-next
node --check src/app.js
node --check src/server/createSocketServer.js
PORT=3001 npm start
curl http://127.0.0.1:3001/api/health
curl http://127.0.0.1:3001/api/status
```

### 前端
```bash
cd /tmp/hermes-gh/holdem-club-next/frontend
npm run build
npm run dev -- --host 0.0.0.0 --port 3000
```

### 浏览器验收
- 打开 `http://127.0.0.1:3000`
- 检查 Landing / Room / Table 页面
- 检查 create / join / start game 的基本链路

---

## 风险与边界

1. **不要现在就暴力升级 Socket.IO 4.x**
   - 先把结构与 payload 理顺，再升级协议层，风险更低。
2. **不要一口气重写 Game 引擎**
   - 当前最值的是在引擎外面建立 clean boundary，而不是立刻推翻重写。
3. **不要继续让旧仓库承载运行职责**
   - 否则端口、文档、代码都会继续混乱。

---

## 完成定义（这一大阶段）

达到下面这些，才算真正从 demo 往成熟产品迈了一步：
- 新仓库成为唯一主运行入口
- 后端有 service / serializer 边界
- 前端有可复用的德扑桌面组件
- 房间 / 牌桌 snapshot 清晰稳定
- 页面观感明显提升
- 性能基线建立
- 一条完整联机流程被验证通过
