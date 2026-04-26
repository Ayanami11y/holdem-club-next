import { socket } from '../../lib/socket';
import { useEffect } from 'react';
import { useRoomStore } from '../../stores/roomStore';
import { useGameStore } from '../../stores/gameStore';

export function useSocketLifecycle() {
  const setRoom = useRoomStore((s) => s.setRoom);
  const setGame = useGameStore((s) => s.setGame);

  useEffect(() => {
    socket.on('hostRoom', (data: any) => {
      if (!data) return;
      setRoom({
        code: data.code || '',
        host: data.host || '',
        players: Array.isArray(data.players) ? data.players : []
      });
    });

    socket.on('joinRoom', (data: any) => {
      if (!data) return;
      setRoom({
        code: data.code || '',
        host: data.host || '',
        players: Array.isArray(data.players) ? data.players : []
      });
    });

    socket.on('displayPossibleMoves', (moves: any) => {
      setGame({ possibleMoves: Array.isArray(moves) ? moves : [] });
    });

    socket.on('gameBegin', () => setGame({ stage: '牌局开始' }));

    return () => {
      socket.off('hostRoom');
      socket.off('joinRoom');
      socket.off('displayPossibleMoves');
      socket.off('gameBegin');
    };
  }, [setGame, setRoom]);
}
