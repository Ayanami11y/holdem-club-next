# River Club Luxury Redesign Plan

> **For Hermes:** Use frontend-design skill direction, but implement directly in the current React codebase.

**Goal:** 把 River Club 从“工程感演示页”重做成一套更像成熟私人扑克产品的全新前端体验，不再暴露端口/连接实现细节，并显著提升视觉品质与交互人味。

**Architecture:** 保留现有 React + Zustand + Socket 架构，不大改数据流；重点重做 Landing / Room / Table 三个页面的视觉层级、信息架构与微交互文案。正式设计方向采用“高端私人扑克俱乐部 / restrained luxury”，参考 Apple 的克制层级、Stripe 的流畅版式、BMW 的深色高级材质感。

**Tech Stack:** React, TypeScript, Zustand, Tailwind base, handcrafted CSS in `frontend/src/styles/globals.css`

---

## 设计总纲

### 美学主张
- 方向：**高端私人扑克俱乐部 / 克制奢华 / 夜间会所气质**
- 关键词：深墨绿、香槟金、黑檀木、烟雾感、低噪音、电影化灯光、少而准的文案
- 禁止项：
  - 暴露 `3000` / `3001` / “实时后端” / “连接状态” 这类工程词
  - 首页出现像运维面板一样的 metric 卡片
  - 过多说明项目升级过程
  - 按钮文案像测试页或后台工具

### 页面角色重定义
1. Landing = 邀请式俱乐部首页
2. Room = 候场与组局空间
3. Table = 真正的牌桌视角

---

## Task 1: 重做 Landing 信息架构

**Objective:** 把首页从技术演示页改成高端扑克俱乐部首页，只保留人能理解的主叙事和主动作。

**Files:**
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/pages/landing/LandingPage.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/styles/globals.css`

**Design requirements:**
- Hero 文案不再讲“升级项目”“实时后端”“3000/3001”
- 主标题强调私密、组局、沉浸感
- 副标题强调：浏览器开桌、朋友组局、随时开打
- 右侧或下方入口卡片只保留：昵称、房码、创建牌桌、加入牌局
- 增加礼宾式辅助文案，如“今晚这桌，谁来坐庄”这类更有人味的 copy
- 增加一个视觉主焦点：大尺寸俱乐部氛围 Hero 区，不堆工程信息

**Verification:**
- 页面首屏不再出现任何端口数字
- 页面首屏不再出现“连接状态 / 实时后端 / 前端入口”字样
- 浏览器首屏视觉焦点明确，主 CTA 只有 1~2 个

---

## Task 2: 重做 Room 候场页

**Objective:** 让房间页像真正的开桌候场空间，而不是数据列表页。

**Files:**
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/pages/room/RoomPage.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/styles/globals.css`

**Design requirements:**
- 房码成为主视觉信息，但以“桌号 / 邀请码”表达
- 房主、人数、盲注、起始筹码改为更自然的俱乐部文案
- 玩家列表改成“席位卡 / 入座状态”而不是裸列表
- “开始牌局”改成更像产品按钮文案，如“牌局开始” / “发牌开桌”
- 错误提示样式更克制，不要像报错面板

**Verification:**
- Room 页面不再像后台配置页
- 席位信息具备视觉层级
- 盲注/筹码信息读起来像牌桌规则，不像接口字段

---

## Task 3: 重做 Table 页面层级

**Objective:** 把牌桌页做成更像正式线上扑克桌，而不是调试控制台。

**Files:**
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/pages/table/TablePage.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/components/table/PokerTable.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/components/table/ActionPanel.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/components/table/PotDisplay.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/components/table/CommunityBoard.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/components/table/SeatRing.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/components/table/PlayerSeat.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/styles/globals.css`

**Design requirements:**
- 顶部信息去技术化，保留对玩家有意义的内容：当前轮次、底池、行动到谁
- Hero 手牌区更像真实手牌展示
- 操作按钮区更有层次，不像默认表单按钮
- 桌面中部强调公共牌与底池，不要让零碎状态抢主焦点
- 玩家席位要有“谁在行动 / 谁已弃牌 / 谁是庄位”的视觉差异

**Verification:**
- Table 页第一眼像牌桌，不像 admin 面板
- 关键信息焦点：桌面 > 公共牌/底池 > 当前行动 > 个人操作

---

## Task 4: 统一文案与状态语气

**Objective:** 把全站交互文案从“工具/调试口吻”统一成更像真实产品的语气。

**Files:**
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/pages/landing/LandingPage.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/pages/room/RoomPage.tsx`
- Modify: `/tmp/hermes-gh/holdem-club-next/frontend/src/pages/table/TablePage.tsx`
- Modify: any related components that render player/status labels

**Content rules:**
- 少解释架构，多表达场景
- 少“系统状态”，多“牌局状态”
- 少“错误”，多“提示 / 未同步 / 稍后重试”
- 不让用户感知技术实现细节

---

## Task 5: 浏览器视觉验收

**Objective:** 改完后必须用浏览器实际看，不凭代码自我感觉良好。

**Files:**
- No source files required

**Verification steps:**
1. build 前端
2. 打开正式域名或本地预览
3. 检查 Landing / Room / Table
4. 确认：
   - 不再暴露端口与内部实现
   - 视觉上像成熟扑克产品
   - CTA 清晰
   - 页面层级稳定

---

## 成功标准

- 用户第一眼不会再说“像调试页”
- 首页不出现 3000/3001 等内部细节
- Room / Table 页面更像扑克产品而不是表单系统
- 整体质感明显提升，达到“全新”而不是“小修小补”
