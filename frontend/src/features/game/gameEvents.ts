import { socket } from '../../lib/socket';

export function requestPossibleMoves() {
  socket.emit('evaluatePossibleMoves');
}

export function makeMove(move: string, bet?: number) {
  socket.emit('moveMade', bet == null ? { move } : { move, bet });
}
