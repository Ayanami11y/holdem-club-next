import type { SeatSnapshot } from '../../types/socket';
import { PlayerSeat } from './PlayerSeat';

type SeatRingProps = {
  seats: SeatSnapshot[];
  currentTurn: string;
  heroUsername?: string;
};

function sortSeatsForRing(seats: SeatSnapshot[], heroUsername?: string) {
  if (!heroUsername) return seats;
  const heroIndex = seats.findIndex((seat) => seat.username === heroUsername);
  if (heroIndex <= 0) return seats;
  return [...seats.slice(heroIndex), ...seats.slice(0, heroIndex)];
}

export function SeatRing({ seats, currentTurn, heroUsername }: SeatRingProps) {
  const arrangedSeats = sortSeatsForRing(seats, heroUsername);

  return (
    <div className="seat-ring seat-ring--cyber">
      {arrangedSeats.map((seat) => (
        <PlayerSeat
          key={`${seat.username}-${seat.seatIndex}`}
          seat={seat}
          active={seat.username === currentTurn}
          hero={seat.username === heroUsername}
        />
      ))}
    </div>
  );
}
