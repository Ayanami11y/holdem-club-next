import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { useRoomStore, defaultSettings } from '../../stores/roomStore';
import { hostRoom, joinRoom } from '../../features/room/roomApi';
import { useSocketLifecycle } from '../../features/socket/useSocketLifecycle';
import { useGameStore } from '../../stores/gameStore';
import riverClubLogo from '../../assets/river-club-cyber-logo.svg';

const presetStacks = [100, 200, 500];

type EntryMode = 'host' | 'join' | null;

type LandingPageProps = {
  initialEntryMode?: EntryMode;
};

export function LandingPage({ initialEntryMode = null }: LandingPageProps) {
  useSocketLifecycle();
  const navigate = useNavigate();
  const { username, roomCode, setUsername, setRoomCode } = useSessionStore();
  const room = useRoomStore();
  const setRoom = useRoomStore((s) => s.setRoom);
  const { lastError, connectionState, roundInProgress, tableCode } = useGameStore((s) => ({
    lastError: s.lastError,
    connectionState: s.connectionState,
    roundInProgress: s.roundInProgress,
    tableCode: s.code,
  }));
  const [entryMode, setEntryMode] = useState<EntryMode>(initialEntryMode);

  const settings = room.settings || defaultSettings;
  const showingEntryHub = entryMode === null;

  useEffect(() => {
    setEntryMode(initialEntryMode);
  }, [initialEntryMode]);

  useEffect(() => {
    if (room.code && room.host && room.players.length) {
      navigate('/room');
    }
  }, [navigate, room.code, room.host, room.players.length]);

  useEffect(() => {
    if (roundInProgress && tableCode) {
      navigate('/table');
    }
  }, [navigate, roundInProgress, tableCode]);

  const stackHint = useMemo(() => {
    const bb = Number(settings.bigBlind) || 1;
    const stack = Number(settings.startingStack) || 0;
    return Math.round(stack / bb);
  }, [settings.bigBlind, settings.startingStack]);

  const tablePaceLabel = useMemo(() => {
    if (settings.bigBlind >= 5) return '偏激进';
    if (settings.bigBlind >= 3) return '中速局';
    return '轻松局';
  }, [settings.bigBlind]);

  const updateSetting = (key: 'smallBlind' | 'bigBlind' | 'startingStack', value: number) => {
    const nextValue = Number.isFinite(value) ? value : 0;
    setRoom({
      settings: {
        ...settings,
        [key]: nextValue,
      },
    });
  };

  const updateAutoRebuy = (value: boolean) => {
    setRoom({
      settings: {
        ...settings,
        autoRebuy: value,
      },
    });
  };

  const onHost = () => {
    const trimmed = username.trim();
    if (!trimmed || connectionState === 'disconnected') return;
    const safeSmallBlind = Math.max(1, Number(settings.smallBlind) || defaultSettings.smallBlind);
    const nextSettings = {
      smallBlind: safeSmallBlind,
      bigBlind: Math.max(safeSmallBlind, Number(settings.bigBlind) || defaultSettings.bigBlind),
      startingStack: Math.max(20, Number(settings.startingStack) || defaultSettings.startingStack),
      autoRebuy: Boolean(settings.autoRebuy),
    };
    setRoom({ host: trimmed, settings: nextSettings, players: [trimmed], playerCount: 1, canStart: false, code: '' });
    hostRoom(trimmed, nextSettings);
  };

  const onJoin = () => {
    const trimmed = username.trim();
    const code = roomCode.trim();
    if (!trimmed || !code || connectionState === 'disconnected') return;
    joinRoom(trimmed, code);
  };

  return (
    <main className="club-shell club-shell--landing club-shell--cyber landing-shell--split">
      <section key={entryMode ?? 'hub'} className="landing-hero-panel landing-hero-panel--product">
        <div className="club-nav club-nav--brandlockup">
          <div className="club-brand-lockup">
            <img className="club-brand-logo" src={riverClubLogo} alt="River Club cyber logo" />
            <div>
              <p className="club-brand-mark">RIVER CLUB</p>
              <p className="club-brand-subtitle">PRIVATE HOLD'EM TABLES</p>
            </div>
          </div>
        </div>

        <div className="landing-hero-copy landing-hero-copy--compact">
          <p className="club-kicker">private table</p>
          <h1>你的私人 Hold'em 牌局。</h1>
          <p className="landing-hero-copy__body">
            房主创建并分享桌号，玩家输入桌号即可直接进桌。
          </p>
          <div className="landing-hero-cta-row">
            <button className="club-button club-button--gold club-button--cyber-primary" onClick={() => navigate('/create')}>
              创建牌局
            </button>
            <button className="club-button club-button--line club-button--cyber-secondary" onClick={() => navigate('/join')}>
              加入牌局
            </button>
          </div>
        </div>

        <div className="landing-hero-actions landing-hero-actions--entry">
          <article>
            <span>房主</span>
            <strong>创建牌局</strong>
            <p>定好规则，生成桌号，再把这一桌发给朋友。</p>
          </article>
          <article>
            <span>玩家</span>
            <strong>加入牌局</strong>
            <p>拿到桌号后直接入座。</p>
          </article>
        </div>
      </section>

      {showingEntryHub ? (
        <section className="landing-control-grid landing-control-grid--entryonly">
          <article className="landing-panel landing-panel--entry landing-panel--entry-primary">
            <div className="landing-panel__header landing-panel__header--entry">
              <div>
                <p className="eyebrow">host a table</p>
                <h2>创建牌局</h2>
                <p className="landing-panel__intro">适合开桌、定规则、拿桌号的人。</p>
              </div>
              <span className="club-chip">房主</span>
            </div>

            <div className="landing-entry-summary">
              <strong>你会做什么</strong>
              <p>创建一桌新的牌局，然后把桌号分享给朋友。</p>
            </div>

            <div className="landing-panel__footer">
              <button
                className="club-button club-button--gold club-button--wide club-button--cyber-primary landing-host-cta"
                onClick={() => window.open('/create', '_blank', 'noopener,noreferrer')}
              >
                去创建牌局页
              </button>
            </div>
          </article>

          <article className="landing-panel landing-panel--entry landing-panel--join-strong landing-panel--join-tight">
            <div className="landing-panel__header landing-panel__header--entry">
              <div>
                <p className="eyebrow">join a table</p>
                <h2>加入牌局</h2>
                <p className="landing-panel__intro">适合已经拿到桌号、只想快速进桌的人。</p>
              </div>
              <span className="club-chip club-chip--subtle">玩家</span>
            </div>

            <div className="landing-entry-summary">
              <strong>你会做什么</strong>
              <p>输入桌号后直接进桌，不需要再看建桌规则。</p>
            </div>

            <div className="landing-panel__footer landing-panel__footer--join">
              <button
                className="club-button club-button--gold club-button--wide club-button--cyber-primary landing-join-cta"
                onClick={() => window.open('/join', '_blank', 'noopener,noreferrer')}
              >
                去加入牌局页
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {entryMode === 'host' ? (
        <section className="landing-subpanel-wrap">
          <article className="landing-panel landing-panel--host landing-panel--host-primary landing-subpanel">
            <div className="landing-panel__header">
              <div>
                <p className="eyebrow">host setup</p>
                <h2>创建牌局</h2>
                <p className="landing-panel__intro">这里专门负责建桌设置，和入桌入口彻底分开。</p>
              </div>
              <button type="button" className="club-button club-button--line club-button--cyber-secondary" onClick={() => navigate('/')}>
                返回首页
              </button>
            </div>

            {lastError ? <div className="club-inline-message">{lastError}</div> : null}
            {connectionState === 'disconnected' ? <div className="club-inline-message">实时连接已断开，先恢复连接再创建牌桌。</div> : null}

            <div className="club-form-grid landing-form-grid">
              <div>
                <label className="club-label">你的昵称</label>
                <input
                  className="club-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="比如 Ayanami"
                />
              </div>

              <div className="landing-settings-card">
                <div className="landing-settings-card__head">
                  <strong>基础规则</strong>
                  <span>这里只保留开桌必须的最少设置</span>
                </div>

                <div className="landing-settings-strip">
                  <div className="landing-form-grid landing-form-grid--two landing-blinds-grid">
                    <div className="landing-field-block">
                      <label className="club-label">小注</label>
                      <input
                        className="club-input"
                        type="number"
                        min={1}
                        value={settings.smallBlind}
                        onChange={(e) => updateSetting('smallBlind', Number(e.target.value))}
                      />
                    </div>
                    <div className="landing-field-block">
                      <label className="club-label">大注</label>
                      <input
                        className="club-input"
                        type="number"
                        min={1}
                        value={settings.bigBlind}
                        onChange={(e) => updateSetting('bigBlind', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="landing-settings-summary">
                    <span>这桌规则</span>
                    <strong>{settings.smallBlind}/{settings.bigBlind}</strong>
                    <p>{tablePaceLabel} · {stackHint} BB 起始深度</p>
                  </div>
                </div>

                <div className="landing-field-block">
                  <label className="club-label">起始筹码</label>
                  <input
                    className="club-input"
                    type="number"
                    min={20}
                    step={10}
                    value={settings.startingStack}
                    onChange={(e) => updateSetting('startingStack', Number(e.target.value))}
                  />
                  <div className="landing-chip-row">
                    {presetStacks.map((stack) => (
                      <button
                        key={stack}
                        type="button"
                        className={`club-chip club-chip--button${settings.startingStack === stack ? ' is-active' : ''}`}
                        onClick={() => updateSetting('startingStack', stack)}
                      >
                        {stack}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="landing-toggle-row">
                <div>
                  <label className="club-label">补码方式</label>
                  <p className="landing-muted">只保留开桌前最常用的一项开关。</p>
                </div>
                <button
                  type="button"
                  className={`landing-toggle${settings.autoRebuy ? ' is-on' : ''}`}
                  onClick={() => updateAutoRebuy(!settings.autoRebuy)}
                  aria-pressed={settings.autoRebuy}
                >
                  <span />
                  <em>{settings.autoRebuy ? '自动补码' : '手动补码'}</em>
                </button>
              </div>
            </div>

            <div className="landing-panel__footer">
              <p>创建后生成桌号，再发给朋友进桌。</p>
              <button className="club-button club-button--gold club-button--wide club-button--cyber-primary landing-host-cta" onClick={onHost} disabled={connectionState === 'disconnected'}>
                创建这桌牌局
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {entryMode === 'join' ? (
        <section className="landing-subpanel-wrap">
          <article className="landing-panel landing-panel--join landing-panel--join-strong landing-panel--join-tight landing-subpanel">
            <div className="landing-panel__header">
              <div>
                <p className="eyebrow">join setup</p>
                <h2>加入牌局</h2>
                <p className="landing-panel__intro">这里专门输入昵称和桌号，只做快速入座。</p>
              </div>
              <button type="button" className="club-button club-button--line club-button--cyber-secondary" onClick={() => navigate('/')}>
                返回首页
              </button>
            </div>

            {lastError ? <div className="club-inline-message">{lastError}</div> : null}
            {connectionState === 'disconnected' ? <div className="club-inline-message">实时连接已断开，先恢复连接再加入牌桌。</div> : null}

            <div className="landing-join-hero landing-join-hero--compact">
              <strong>有桌号就直接进。</strong>
              <p>这里不展示建桌规则，只做快速入座。</p>
            </div>

            <div className="club-form-grid landing-form-grid landing-form-grid--join-tight">
              <div>
                <label className="club-label">你的昵称</label>
                <input
                  className="club-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="和朋友看到的昵称一致"
                />
              </div>
              <div>
                <label className="club-label">桌号</label>
                <input
                  className="club-input club-input--code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="输入 4 位桌号"
                  maxLength={8}
                />
              </div>
            </div>

            <div className="landing-panel__footer landing-panel__footer--join">
              <p>输入桌号后会直接进入候场厅。</p>
              <button className="club-button club-button--gold club-button--wide club-button--cyber-primary landing-join-cta" onClick={onJoin}>
                立即加入这桌
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
