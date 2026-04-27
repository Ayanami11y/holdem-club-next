type PotDisplayProps = {
  pot: number;
  topBet: number;
  roundInProgress: boolean;
};

export function PotDisplay({ pot, topBet, roundInProgress }: PotDisplayProps) {
  return (
    <div className="pot-display pot-display--cyber pot-display--tablehud">
      <div className="pot-display__metric pot-display__metric--primary">
        <p className="eyebrow">main pot</p>
        <strong>${pot}</strong>
      </div>
      <div className="pot-display__rail">
        <div className="pot-display__metric">
          <p className="eyebrow">to call</p>
          <strong>${topBet}</strong>
        </div>
        <div className="pot-display__metric">
          <p className="eyebrow">state</p>
          <strong>{roundInProgress ? 'LIVE' : 'READY'}</strong>
        </div>
      </div>
    </div>
  );
}
