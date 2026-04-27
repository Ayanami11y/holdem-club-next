import type { SeatSnapshot } from '../../types/socket';

type PlayerSeatProps = {
  seat: SeatSnapshot;
  active: boolean;
  hero?: boolean;
};

function describeSeatState(seat: SeatSnapshot) {
  if (seat.allIn) return 'ALL-IN';
  if (seat.folded) return '已弃牌';
  if (seat.isChecked) return '已过牌';
  if (seat.blind) return seat.blind;
  return seat.status || '等待';
}

export function PlayerSeat({ seat, active, hero = false }: PlayerSeatProps) {
  return (
    <div className={`player-seat player-seat--cyber${active ? ' is-active' : ''}${hero ? ' is-hero' : ''}`}>
      <div className="player-seat__ambient" aria-hidden="true" />
      <div className="player-seat__ambient player-seat__ambient--secondary" aria-hidden="true" />
      <div className="player-seat__topline">
        <span className="player-seat__name">{seat.username}</span>
        <div className="player-seat__badges">
          {hero ? <span className="player-seat__badge player-seat__badge--hero">YOU</span> : null}
          {seat.dealer ? <span className="player-seat__badge">D</span> : null}
        </div>
      </div>
      <div className="player-seat__state">{describeSeatState(seat)}</div>
      <div className="player-seat__meta">
        <span>筹码 ${seat.stack}</span>
        <span>本轮 ${seat.currentBet}</span>
      </div>
      <div className="player-seat__foot">
        <span>买入 {seat.buyIns}</span>
        <span>{active ? '行动中' : '待位'}</span>
      </div>
      <div className="player-seat__rail" aria-hidden="true" />
    </div>
  );
}
