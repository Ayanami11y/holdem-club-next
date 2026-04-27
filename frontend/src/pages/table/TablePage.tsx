import { useEffect, useMemo, useState } from 'react';
import { requestPossibleMoves, makeMove, requestNextRound } from '../../features/game/gameEvents';
import { useSocketLifecycle } from '../../features/socket/useSocketLifecycle';
import { useGameStore } from '../../stores/gameStore';
import { PokerTable } from '../../components/table/PokerTable';
import { ActionPanel } from '../../components/table/ActionPanel';
import nodeCoreLogo from '../../assets/river-club-cyber-logo.svg';

export function TablePage() {
  useSocketLifecycle();
  const game = useGameStore();
  const [betSize, setBetSize] = useState(() => Math.max(game.topBet || 20, 20));

  useEffect(() => {
    requestPossibleMoves();
  }, []);

  useEffect(() => {
    setBetSize((current) => {
      const suggested = Math.max(game.topBet || 20, 20);
      return current < suggested ? suggested : current;
    });
  }, [game.topBet]);

  const tableSnapshot = useMemo(
    () => ({
      code: game.code,
      stage: game.stage,
      pot: game.pot,
      topBet: game.topBet,
      communityCards: game.communityCards,
      currentTurn: game.currentTurn,
      roundInProgress: game.roundInProgress,
      players: game.players,
      playerCount: game.players.length,
      hero: game.hero,
    }),
    [game.code, game.stage, game.pot, game.topBet, game.communityCards, game.currentTurn, game.roundInProgress, game.players, game.hero]
  );

  const betweenHands = !game.roundInProgress;
  const tableStateLabel = betweenHands ? 'TABLE IDLE' : 'HAND LIVE';
  const tableStateCopy = betweenHands
    ? '桌面退回静默待发态，牌面与筹码锁在低亮模式，只等下一手重新上线。'
    : '行动链已经接通，当前压力继续沿活跃席位传导，桌心保持热区。';
  const heroStatusLine = game.currentTurn === game.hero?.username
    ? '你在行动位，直接从右侧动作轨完成这一步。'
    : betweenHands
      ? '你的席位保持在线，下一手发牌后会立刻重新接回桌边。'
      : '当前焦点不在你，先观察桌心底池与其他席位的下注传递。';

  return (
    <main className="club-shell club-shell--room club-shell--cyber table-shell table-shell--cyber">
      {game.lastError ? <section className="alert-bar">{game.lastError}</section> : null}

      <section className="table-command-bar table-command-bar--brandstage table-command-bar--cyberline">
        <div className="club-brand-lockup club-brand-lockup--compact club-brand-lockup--flagship">
          <div className="club-brand-lockup__crest">
            <img className="club-brand-logo club-brand-logo--small club-brand-logo--flagship" src={nodeCoreLogo} alt="Node core table logo" />
          </div>
          <div className="club-brand-lockup__copy">
            <p className="club-brand-kicker">OFF-GRID CARD NODE</p>
            <p className="club-brand-mark">RIVER//NODE</p>
            <p className="club-brand-subtitle club-brand-subtitle--flagship">NO-LIMIT HOLD'EM · TABLE {game.code || 'READY'}</p>
          </div>
        </div>

        <div className="table-command-bar__status table-command-bar__status--flagship">
          <span className="table-status-pill table-status-pill--accent">{tableStateLabel}</span>
          <span className="table-status-pill">LINK STABLE</span>
        </div>
      </section>

      <PokerTable snapshot={tableSnapshot} />

      <div className="table-bottom-grid table-bottom-grid--cyber table-bottom-grid--showcase table-bottom-grid--railattached">
        <section className="hero-panel hero-panel--cyber hero-panel--supporting hero-panel--seatdock hero-panel--cyberline">
          <div className="hero-panel__docknotch" aria-hidden="true" />
          <div className="hero-panel__tetherline" aria-hidden="true" />

          <div className="hero-panel__header">
            <div>
              <p className="eyebrow">hero seat</p>
              <h3>{game.hero?.username || '你的席位'}</h3>
              <p className="hero-panel__subtitle">{tableStateCopy}</p>
            </div>
            <span className="club-chip club-chip--cyber">stack ${game.hero?.stack ?? 0}</span>
          </div>

          <div className="hero-panel__seatdock-core">
            <div className="hero-cards hero-cards--cyber hero-cards--slot hero-cards--seatdock">
              {(game.heroCards.length ? game.heroCards : ['?', '?']).map((card, index) => (
                <div key={`${card}-${index}`} className={`playing-card playing-card--hero playing-card--cyber playing-card--hero-slot${card === '?' ? ' playing-card--masked' : ''}`}>
                  <span className="playing-card__glow" aria-hidden="true" />
                  <span className="playing-card__value">{card}</span>
                </div>
              ))}
            </div>

            <div className="hero-panel__seatdock-meta">
              <div className="hero-panel__meta-row hero-panel__meta-row--seatdock">
                <span>本轮下注 ${game.hero?.currentBet ?? 0}</span>
                <span>{game.hero?.blind || '未入盲'}</span>
              </div>

              <div className="hero-panel__statusline">
                <span className="hero-panel__statusline-label">seat status</span>
                <strong>{game.currentTurn === game.hero?.username ? '你行动中' : betweenHands ? '等待下一手' : '桌面进行中'}</strong>
                <p>{heroStatusLine}</p>
              </div>

              <div className="hero-panel__notes hero-panel__notes--seatdock">
                <div className="hero-panel__note hero-panel__note--quiet hero-panel__note--seatdock">
                  <span>{betweenHands ? 'next hand cue' : game.currentTurn === game.hero?.username ? 'action cue' : 'table feed'}</span>
                  <p>{betweenHands ? '空档期只保留必要信息：栈深、盲注状态和你的落座位置。' : '你的手牌与栈深固定在桌边，不用离开主舞台也能完成判断。'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ActionPanel
          possibleMoves={game.possibleMoves}
          currentTurn={game.currentTurn}
          roundInProgress={game.roundInProgress}
          betSize={betSize}
          onBetSizeChange={setBetSize}
          onFold={() => makeMove('fold')}
          onCheck={() => makeMove('check')}
          onCall={() => makeMove('call')}
          onBet={() => makeMove('bet', betSize)}
          onNextRound={() => requestNextRound()}
        />
      </div>
    </main>
  );
}
