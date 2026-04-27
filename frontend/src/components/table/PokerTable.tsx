import type { TableSnapshot } from '../../types/socket';
import { CommunityBoard } from './CommunityBoard';
import { PotDisplay } from './PotDisplay';
import { SeatRing } from './SeatRing';

type PokerTableProps = {
  snapshot: TableSnapshot;
};

export function PokerTable({ snapshot }: PokerTableProps) {
  const tableTitle = snapshot.code || '牌桌';
  const betweenHands = !snapshot.roundInProgress;
  const occupancyLabel = `${snapshot.playerCount} SEATS LIVE`;
  const heroTurn = snapshot.currentTurn === snapshot.hero?.username;
  const tableStateLabel = betweenHands ? 'NEXT HAND READY' : heroTurn ? 'HERO TO ACT' : 'TABLE LIVE';

  return (
    <section className="poker-table poker-table--cyber">
      <div className="poker-table__header poker-table__header--cyber poker-table__header--minimal">
        <div>
          <p className="eyebrow">table</p>
          <h1>{tableTitle}</h1>
        </div>
        <PotDisplay pot={snapshot.pot} topBet={snapshot.topBet} roundInProgress={snapshot.roundInProgress} />
      </div>

      <div className={`poker-felt poker-felt--cyber${betweenHands ? ' poker-felt--intermission' : ''}`}>
        <div className="poker-felt__ambient poker-felt__ambient--top" />
        <div className="poker-felt__ambient poker-felt__ambient--left" />
        <div className="poker-felt__ambient poker-felt__ambient--right" />
        <div className="poker-felt__hero-tether poker-felt__hero-tether--beam" aria-hidden="true" />
        <div className="poker-felt__hero-tether poker-felt__hero-tether--spine" aria-hidden="true" />
        <div className="poker-felt__hero-tether poker-felt__hero-tether--dock" aria-hidden="true" />
        <div className="poker-felt__vignette" />
        <div className="poker-felt__rim" />
        <div className="poker-felt__scanlines" />
        <div className="poker-felt__spotlight" />
        <div className="poker-felt__grid" />
        <div className="poker-felt__noise" />
        <div className="poker-felt__hazard poker-felt__hazard--left" />
        <div className="poker-felt__hazard poker-felt__hazard--right" />

        <div className="poker-table__centerpiece poker-table__centerpiece--elevated">
          <div className="poker-table__core-lane" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="poker-table__pot-cluster poker-table__pot-cluster--cybercore">
            <span className="poker-table__pot-label">main pot</span>
            <strong>${snapshot.pot}</strong>
            <div className="poker-table__pot-statusbar" aria-hidden="true">
              <span>{tableStateLabel}</span>
              <span>{occupancyLabel}</span>
            </div>
            <div className="poker-table__chip-stack poker-table__chip-stack--core" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          {betweenHands ? (
            <div className="poker-table__intermission-marquee poker-table__intermission-marquee--cyber" aria-hidden="true">
              <span>NEURAL TABLE</span>
              <span>LOW LIGHT</span>
              <span>READY</span>
            </div>
          ) : null}

          <CommunityBoard cards={snapshot.communityCards} stage={snapshot.stage} />

          <div className="poker-table__dealer-markers poker-table__dealer-markers--offline" aria-hidden="true">
            <span className="poker-table__dealer-button">D</span>
            <span className="poker-table__turn-glow">{betweenHands ? 'READY' : heroTurn ? 'YOUR MOVE' : 'LIVE'}</span>
          </div>

          <div className="poker-table__hero-anchor" aria-hidden="true">
            <span className="poker-table__hero-anchor-ring" />
            <span className="poker-table__hero-anchor-core">YOU</span>
            <span className="poker-table__hero-anchor-trace">SEAT LOCK</span>
          </div>
        </div>

        <SeatRing
          seats={snapshot.players}
          currentTurn={snapshot.currentTurn}
          heroUsername={snapshot.hero?.username}
        />
      </div>
    </section>
  );
}
