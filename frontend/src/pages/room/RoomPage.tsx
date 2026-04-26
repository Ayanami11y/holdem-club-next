import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../stores/roomStore';
import { startGame } from '../../features/room/roomApi';
import { useSocketLifecycle } from '../../features/socket/useSocketLifecycle';

export function RoomPage() {
  useSocketLifecycle();
  const navigate = useNavigate();
  const room = useRoomStore();

  const onStart = () => {
    if (room.code) startGame(room.code);
    navigate('/table');
  };

  return (
    <main className="shell">
      <div className="grid-2">
        <section className="card" style={{ padding: 24 }}>
          <p style={{ color: '#e4c476', textTransform: 'uppercase', letterSpacing: 2 }}>room lobby</p>
          <h1 style={{ marginTop: 8 }}>房间 {room.code || '等待服务端回填房码'}</h1>
          <p style={{ color: '#bfb49a' }}>房主：{room.host || '未同步'} · 当前 {room.players.length} 人</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            {room.players.map((player) => (
              <span key={player} className="btn-secondary" style={{ cursor: 'default' }}>{player}</span>
            ))}
          </div>
        </section>
        <section className="card" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>牌桌设置</h3>
          <p style={{ color: '#bfb49a' }}>小盲 {room.settings.smallBlind} / 大盲 {room.settings.bigBlind}</p>
          <p style={{ color: '#bfb49a' }}>起始筹码 {room.settings.startingStack}</p>
          <p style={{ color: '#bfb49a' }}>{room.settings.autoRebuy ? '自动补码已开启' : '自动补码已关闭'}</p>
          <button className="btn-primary" onClick={onStart}>开始牌局</button>
        </section>
      </div>
    </main>
  );
}
