import { useEffect } from 'react';
import { requestPossibleMoves, makeMove } from '../../features/game/gameEvents';
import { useSocketLifecycle } from '../../features/socket/useSocketLifecycle';
import { useGameStore } from '../../stores/gameStore';
import { useRoomStore } from '../../stores/roomStore';

export function TablePage() {
  useSocketLifecycle();
  const game = useGameStore();
  const room = useRoomStore();

  useEffect(() => {
    requestPossibleMoves();
  }, []);

  return (
    <main className="shell">
      <section className="card" style={{ padding: 24, marginBottom: 24 }}>
        <p style={{ color: '#e4c476', textTransform: 'uppercase', letterSpacing: 2 }}>table view</p>
        <h1 style={{ marginTop: 8 }}>River Club 桌面</h1>
        <p style={{ color: '#bfb49a' }}>房间 {room.code || '未同步'} · 阶段：{game.stage}</p>
      </section>
      <div className="grid-2">
        <section className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>公共牌与底池</h3>
          <p>底池：${game.pot}</p>
          <p>顶注：${game.topBet}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(game.communityCards.length ? game.communityCards : ['?', '?', '?', '?', '?']).map((card, i) => (
              <div key={i} style={{ width: 64, height: 88, borderRadius: 16, border: '1px solid rgba(228,196,118,.18)', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.03)' }}>{card}</div>
            ))}
          </div>
        </section>
        <section className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>操作区</h3>
          <p style={{ color: '#bfb49a' }}>可行动作：{game.possibleMoves.length ? game.possibleMoves.join(' / ') : '等待服务端同步'}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn-secondary" onClick={() => makeMove('fold')}>弃牌</button>
            <button className="btn-secondary" onClick={() => makeMove('check')}>过牌</button>
            <button className="btn-secondary" onClick={() => makeMove('call')}>跟注</button>
            <button className="btn-primary" onClick={() => makeMove('bet', 10)}>下注 10</button>
          </div>
        </section>
      </div>
    </main>
  );
}
