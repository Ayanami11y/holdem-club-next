import type { PossibleMoves } from '../../stores/gameStore';

type ActionPanelProps = {
  possibleMoves: PossibleMoves;
  currentTurn: string;
  roundInProgress: boolean;
  betSize: number;
  onBetSizeChange: (value: number) => void;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onBet: () => void;
  onNextRound: () => void;
};

function hasMove(possibleMoves: PossibleMoves, move: string) {
  return possibleMoves[move] !== undefined && possibleMoves[move] !== 'no';
}

function getMoveSummary(possibleMoves: PossibleMoves) {
  const entries = Object.entries(possibleMoves).filter(([, value]) => value !== 'no' && value !== undefined);
  if (!entries.length) return 'sync pending';
  return entries.map(([key, value]) => (typeof value === 'number' ? `${key} ${value}` : key)).join(' · ');
}

export function ActionPanel({
  possibleMoves,
  currentTurn,
  roundInProgress,
  betSize,
  onBetSizeChange,
  onFold,
  onCheck,
  onCall,
  onBet,
  onNextRound,
}: ActionPanelProps) {
  const waiting = !Object.keys(possibleMoves).length;
  const canBet = hasMove(possibleMoves, 'bet');
  const canFold = hasMove(possibleMoves, 'fold');
  const canCheck = hasMove(possibleMoves, 'check');
  const canCall = hasMove(possibleMoves, 'call');
  const canAdvance = !roundInProgress;
  const canActThisTurn = canFold || canCheck || canCall || canBet;
  const inputDisabled = !canBet;
  const panelTitle = canAdvance ? 'NEXT HAND' : currentTurn || 'YOUR TURN';
  const panelMeta = canAdvance ? 'table cool' : waiting ? 'sync pending' : getMoveSummary(possibleMoves);
  const stateLabel = canAdvance ? '本手结束，准备发下一手。' : canActThisTurn ? '动作已经切到你，直接完成这一步。' : '当前不是你的回合，动作区保持低亮。';

  const presets = [10, 30, 60];
  const applyPreset = (value: number) => onBetSizeChange(Math.max(0, value));

  return (
    <section className="action-panel action-panel--cyber action-panel--edge-rail">
      <div className="action-panel__header action-panel__header--rail">
        <div>
          <p className="eyebrow">action rail</p>
          <h3>{panelTitle}</h3>
          <p className="action-panel__subtitle">{stateLabel}</p>
        </div>
        <span className="action-panel__moves">{panelMeta}</span>
      </div>

      {canAdvance ? (
        <div className="action-panel__restart-stage">
          <button className="club-button club-button--cyber-primary club-button--action club-button--showtime action-panel__advance-key action-panel__advance-key--hero" onClick={onNextRound}>
            <span className="action-panel__execute-label">boot sequence</span>
            <strong>启动下一手</strong>
            <small>re-arm table core</small>
          </button>
        </div>
      ) : (
        <>
          <div className="action-panel__betbox action-panel__betbox--rail action-panel__betbox--live">
            <div className="action-panel__betbox-head">
              <label className="club-label" htmlFor="bet-size">下注档位</label>
              <span className={`action-panel__availability ${canBet ? 'action-panel__availability--live' : 'action-panel__availability--locked'}`}>
                {canBet ? 'ARMED' : 'LOCKED'}
              </span>
            </div>

            <div className="action-panel__pressure-strip" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="action-panel__firemode-grid action-panel__firemode-grid--rail">
              {presets.map((value, index) => (
                <button
                  key={value}
                  className="action-panel__firemode"
                  type="button"
                  onClick={() => applyPreset(value)}
                  disabled={inputDisabled}
                >
                  <span>pulse {index + 1}</span>
                  <strong>{value}</strong>
                  <small>{index === 0 ? 'light breach' : index === 1 ? 'mid spike' : 'hard shove'}</small>
                </button>
              ))}
            </div>

            <div className="action-panel__betrow action-panel__betrow--rail">
              <div className="action-panel__bet-terminal action-panel__bet-terminal--override">
                <span className="action-panel__terminal-label">manual override</span>
                <input
                  id="bet-size"
                  className="club-input action-panel__input"
                  type="number"
                  min={1}
                  step={10}
                  value={betSize}
                  disabled={inputDisabled}
                  onChange={(e) => onBetSizeChange(Number(e.target.value) || 0)}
                />
              </div>

              <button className="club-button club-button--cyber-primary club-button--action club-button--commit action-panel__execute action-panel__execute--primary" onClick={onBet} disabled={!canBet}>
                <span className="action-panel__execute-label">execute pulse</span>
                <strong>注入脉冲</strong>
                <small className="action-panel__execute-meta">armed output // {betSize}</small>
              </button>
            </div>

            <p className="action-panel__betmeta">
              {canBet ? `当前已装填 ${betSize} 单位；先用预设档，再做手动微调。` : '下注主执行键未解锁；轮到你时这里会自动点亮。'}
            </p>
          </div>

          <div className="action-panel__support-row">
            <div className="action-panel__support-keys action-panel__support-keys--rail">
              <button className="club-button club-button--cyber-danger club-button--action" onClick={onFold} disabled={!canFold}>
                弃牌
              </button>
              <button className="club-button club-button--cyber-secondary club-button--action" onClick={onCheck} disabled={!canCheck}>
                过牌
              </button>
              <button className="club-button club-button--cyber-secondary club-button--action" onClick={onCall} disabled={!canCall}>
                跟注
              </button>
            </div>

            <div className="action-panel__statebar action-panel__statebar--rail">
              <span className={`action-panel__statechip ${canActThisTurn ? 'action-panel__statechip--active' : 'action-panel__statechip--idle'}`}>
                {canActThisTurn ? 'HERO LIVE' : 'WAITING TURN'}
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
