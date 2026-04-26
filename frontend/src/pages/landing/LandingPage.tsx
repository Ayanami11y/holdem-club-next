import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { useRoomStore, defaultSettings } from '../../stores/roomStore';
import { hostRoom, joinRoom } from '../../features/room/roomApi';
import { useSocketLifecycle } from '../../features/socket/useSocketLifecycle';

export function LandingPage() {
  useSocketLifecycle();
  const navigate = useNavigate();
  const { username, roomCode, setUsername, setRoomCode } = useSessionStore();
  const setRoom = useRoomStore((s) => s.setRoom);

  const onHost = () => {
    if (!username.trim()) return;
    setRoom({ host: username, settings: defaultSettings });
    hostRoom(username, defaultSettings);
    navigate('/room');
  };

  const onJoin = () => {
    if (!username.trim() || !roomCode.trim()) return;
    joinRoom(username, roomCode);
    navigate('/room');
  };

  return (
    <main className="shell" style={{ paddingTop: 40 }}>
      <div className="grid-2" style={{ alignItems: 'center' }}>
        <section>
          <p style={{ color: '#e4c476', letterSpacing: 3, textTransform: 'uppercase' }}>private table · browser play</p>
          <h1 style={{ fontSize: 56, lineHeight: 1.05, margin: '8px 0 16px' }}>新的 River Club，从房码组局开始。</h1>
          <p style={{ color: '#bfb49a', fontSize: 18, lineHeight: 1.7, maxWidth: 560 }}>
            用现代前端重做首页、房间和牌桌。先把观感、结构和实时入口做好，再继续迁移整套牌局体验。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <button className="btn-primary" onClick={onHost}>创建牌桌</button>
            <a className="btn-secondary" href="#entry">直接加入房间</a>
          </div>
        </section>
        <section className="card" id="entry" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>快速进房</h3>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label className="label">昵称</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="你的牌桌昵称" />
            </div>
            <div>
              <label className="label">房码</label>
              <input className="input" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="4位房码，加入时填写" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" onClick={onHost}>我来开桌</button>
              <button className="btn-secondary" onClick={onJoin}>输入房码加入</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
