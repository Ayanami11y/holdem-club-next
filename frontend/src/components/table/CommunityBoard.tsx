type CommunityBoardProps = {
  cards: string[];
  stage: string;
};

function boardLabel(stage: string) {
  if (!stage || stage === '等待开局') return 'BOARD BUS // IDLE';
  return `BOARD BUS // ${stage.toUpperCase()}`;
}

function stageDetail(stage: string) {
  const normalized = stage?.toLowerCase() ?? '';
  if (!stage || stage === '等待开局') return 'waiting for next hand';
  if (normalized.includes('flop')) return 'flop cluster live';
  if (normalized.includes('turn')) return 'turn relay online';
  if (normalized.includes('river')) return 'river relay live';
  if (normalized.includes('showdown')) return 'showdown trace';
  return 'board active';
}

function slotLabel(index: number) {
  if (index < 3) return `F${index + 1}`;
  if (index === 3) return 'TURN';
  return 'RIVER';
}

function cardFace(card: string, index: number) {
  return card === '?' ? `NX-${index + 1}` : card;
}

export function CommunityBoard({ cards, stage }: CommunityBoardProps) {
  const displayCards = cards.length ? cards : ['?', '?', '?', '?', '?'];

  return (
    <section className="community-board community-board--cyber">
      <div className="community-board__header">
        <span className="community-board__stage">{boardLabel(stage)}</span>
        <h2>公共牌总线</h2>
        <span className="community-board__trace">{stageDetail(stage)}</span>
      </div>

      <div className="community-board__rails">
        <div className="community-board__cluster community-board__cluster--flop">
          <span className="community-board__cluster-label">main flop cluster</span>
          <div className="community-board__cards">
            {displayCards.slice(0, 3).map((card, index) => (
              <div key={`${card}-${index}`} className={`community-board__relay-card${card === '?' ? ' community-board__relay-card--ghost' : ''}`}>
                <span className="community-board__slot-label">{slotLabel(index)}</span>
                <strong>{cardFace(card, index)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="community-board__node community-board__node--turn">
          <span className="community-board__signal" aria-hidden="true" />
          <span className="community-board__node-label">turn relay</span>
          <div className="community-board__node-card">
            <div className={`community-board__relay-card${displayCards[3] === '?' ? ' community-board__relay-card--ghost' : ''}`}>
              <span className="community-board__slot-label">{slotLabel(3)}</span>
              <strong>{cardFace(displayCards[3], 3)}</strong>
            </div>
          </div>
        </div>

        <div className="community-board__node community-board__node--river">
          <span className="community-board__signal" aria-hidden="true" />
          <span className="community-board__node-label">river relay</span>
          <div className="community-board__node-card">
            <div className={`community-board__relay-card${displayCards[4] === '?' ? ' community-board__relay-card--ghost' : ''}`}>
              <span className="community-board__slot-label">{slotLabel(4)}</span>
              <strong>{cardFace(displayCards[4], 4)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
