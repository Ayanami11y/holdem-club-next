import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { startGame } from '../../features/room/roomApi';
import { useSocketLifecycle } from '../../features/socket/useSocketLifecycle';
import { useGameStore } from '../../stores/gameStore';
import riverClubLogo from '../../assets/river-club-cyber-logo.svg';

type SeatNode = {
  seatNumber: number;
  player: string | null;
  role: string;
  orbitClass: string;
};

const orbitClasses = [
  'seat-orbit seat-orbit--top-left',
  'seat-orbit seat-orbit--top-mid-left',
  'seat-orbit seat-orbit--top-center',
  'seat-orbit seat-orbit--top-mid-right',
  'seat-orbit seat-orbit--top-right',
  'seat-orbit seat-orbit--left-mid',
  'seat-orbit seat-orbit--right-mid',
  'seat-orbit seat-orbit--bottom-left',
  'seat-orbit seat-orbit--bottom-center',
  'seat-orbit seat-orbit--bottom-right',
  'seat-orbit seat-orbit--dealer-slot',
];

const MAX_SEATS = 11;

function buildSeatMap(players: string[], host: string, maxSeats = MAX_SEATS): SeatNode[] {
  return Array.from({ length: maxSeats }, (_, index) => {
    const player = players[index] ?? null;
    return {
      seatNumber: index + 1,
      player,
      role: player ? (player === host ? '房主' : '已入座') : '空位',
      orbitClass: orbitClasses[index] || 'seat-orbit',
    };
  });
}

export function RoomPage() {
  useSocketLifecycle();
  const navigate = useNavigate();
  const room = useRoomStore();
  const { lastError, hero, roundInProgress, code: tableCode } = useGameStore((s) => ({
    lastError: s.lastError,
    hero: s.hero,
    roundInProgress: s.roundInProgress,
    code: s.code,
  }));

  const isHost = Boolean(hero?.username) && hero?.username === room.host;
  const canLaunchGame = Boolean(room.canStart) && isHost;

  useEffect(() => {
    if (roundInProgress && tableCode) {
      navigate('/table');
    }
  }, [navigate, roundInProgress, tableCode]);

  const onStart = () => {
    if (canLaunchGame && room.code) startGame(room.code);
  };

  const seatMap = buildSeatMap(room.players, room.host, MAX_SEATS);
  const seatedCount = room.playerCount || room.players.length;
  const playersNeeded = Math.max(0, 2 - seatedCount);
  const settings = room.settings;
  const rebuyLabel = settings.autoRebuy ? '自动补码开启' : '手动补码';

  return (
    <main className="club-shell club-shell--room club-shell--minimal club-shell--cyber room-shell--orbit">
      <section className="room-topbar">
        <div className="club-brand-lockup club-brand-lockup--compact">
          <img className="club-brand-logo club-brand-logo--small" src={riverClubLogo} alt="River Club cyber logo" />
          <div>
            <p className="club-brand-mark">RIVER CLUB</p>
            <p className="club-brand-subtitle">ROOM {room.code || '待生成'} · NLH · {room.settings.smallBlind}/{room.settings.bigBlind} · BUY-IN {room.settings.startingStack}</p>
          </div>
        </div>

        <div className="table-command-bar__status">
          <span className="table-status-pill">{seatedCount} / {MAX_SEATS}</span>
          <span className="table-status-pill table-status-pill--accent">{playersNeeded === 0 ? '可开局' : `还差 ${playersNeeded} 人开局`}</span>
          {isHost ? (
            <button className="club-button club-button--gold club-button--cyber-primary" onClick={onStart} disabled={!canLaunchGame}>
              发牌
            </button>
          ) : (
            <span className="table-status-pill">等待房主开局</span>
          )}
        </div>
      </section>

      {lastError ? <section className="alert-bar">{lastError}</section> : null}

      <section className="room-salon-intro">
        <article className="room-salon-intro__hero">
          <p className="eyebrow">private room</p>
          <h1>房主已开好桌，等人齐即可开局。</h1>
          <p>
            把桌号发给朋友，入座满两位后，房主就能直接发牌。
          </p>
        </article>

        <article className="room-salon-intro__rail">
          <div className="room-rail-card">
            <span>桌号</span>
            <strong>{room.code || '待生成'}</strong>
            <p>把这个桌号发给朋友，让他们从加入入口直接进桌。</p>
          </div>
          <div className="room-rail-card">
            <span>本桌规则</span>
            <strong>
              {settings.smallBlind}/{settings.bigBlind}
            </strong>
            <p>买入 {settings.startingStack} · {rebuyLabel}</p>
          </div>
          <div className="room-rail-card">
            <span>开局条件</span>
            <strong>{playersNeeded === 0 ? '随时可发牌' : `还差 ${playersNeeded} 位`}</strong>
            <p>已入座 {seatedCount} / {MAX_SEATS}，房主可在人数满足后直接发牌。</p>
          </div>
        </article>
      </section>

      <section className="room-orbit-table">
        <div className="room-orbit-table__surface">
          <div className="room-orbit-table__halo" />
          <div className="room-orbit-table__glow room-orbit-table__glow--left" />
          <div className="room-orbit-table__glow room-orbit-table__glow--right" />

          <div className="room-table-center">
            <div className="room-table-center__pot">POT 0</div>
            <div className="room-table-center__board">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="room-table-center__meta">
              <span className="table-status-pill">邀请制牌桌</span>
              <span className="table-status-pill table-status-pill--accent">房主 {room.host || '同步中'}</span>
            </div>
          </div>

          <div className="room-orbit-table__legend">
            <span className="table-status-pill">朋友入座后按顺位落座</span>
          </div>

          {seatMap.map((seat) => (
            <article
              key={seat.seatNumber}
              className={`${seat.orbitClass}${seat.player ? ' is-filled' : ''}${seat.player === room.host ? ' is-host' : ''}${seat.player ? '' : ' is-empty'}`}
            >
              <span className="seat-orbit__label">Seat {seat.seatNumber}</span>
              <strong>{seat.player || '空位'}</strong>
              <span className="seat-orbit__meta">{seat.player ? seat.role : '可入座'}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
