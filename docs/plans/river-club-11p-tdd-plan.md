# River Club 多人长局与边缘场景 TDD 计划

> 目标：先用失败用例锁定“11 人正常游玩 10 轮以上”与关键边缘条件，再做最小实现。

## 测试分层

### 1. 牌局核心规则层（`test/classes/game.multiplayer.test.js`）
覆盖：
- 11 人入桌可开局
- 连续完成 10+ 轮不死锁
- 每轮都能结束并进入下一轮
- 玩家筹码不出现负数
- 关闭自动补码时，总筹码守恒
- 庄家 / 小盲 / 大盲持续轮转
- 存在短码、all-in、fold 混合局面时不会卡死

### 2. 服务编排层（`test/server/gameService.test.js`）
覆盖：
- 房主可开局，非房主不能开局
- 房间可容纳 11 人并正常 join
- 玩家断线后 active player 统计正确
- startNextRound 在上一轮结束后可继续推进
- table serializer 在 11 人桌下稳定输出

## 首批 RED 用例

### Game 层
1. `supports eleven players across more than ten completed rounds without deadlock`
2. `preserves total chips across 11-player simulation when auto rebuy is disabled`
3. `keeps dealer and blind rotation progressing across many rounds`
4. `survives mixed folds and short-stack all-ins in a large table simulation`

### Service 层
5. `allows a room to fill to eleven players and start from host socket only`
6. `removes disconnected players from registry-backed active counts`
7. `serializes a full eleven-player table snapshot without crashing`

## 验证方式
- 先跑新增测试文件，确认 RED
- 再做最小实现到 GREEN
- 每通过一个行为，再跑相关全集避免回归

## 执行原则
- 不先修代码
- 不把多个行为绑成一个大修
- 每次只推进一个失败断言到通过
