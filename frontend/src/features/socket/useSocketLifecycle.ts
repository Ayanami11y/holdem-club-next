import { socket } from '../../lib/socket';
import { useEffect } from 'react';
import { useRoomStore } from '../../stores/roomStore';
import { useGameStore, type PossibleMoves } from '../../stores/gameStore';
import type { RoomSnapshot, SocketErrorPayload, TableSnapshot } from '../../types/socket';

export function useSocketLifecycle() {
  const applyRoomSnapshot = useRoomStore((s) => s.applySnapshot);
  const setRoom = useRoomStore((s) => s.setRoom);
  const applyTableSnapshot = useGameStore((s) => s.applySnapshot);
  const setGame = useGameStore((s) => s.setGame);
  const setConnectionState = useGameStore((s) => s.setConnectionState);
  const setLastError = useGameStore((s) => s.setLastError);

  useEffect(() => {
    setConnectionState(socket.connected ? 'connected' : 'connecting');

    const handleRoomSnapshot = (data: RoomSnapshot) => {
      if (!data) return;
      applyRoomSnapshot(data);
      if (data.table) {
        applyTableSnapshot(data.table);
      }
    };

    const handleTableSnapshot = (data: TableSnapshot) => {
      if (!data) return;
      applyTableSnapshot(data);
    };

    const handleLegacyRoom = (data: any) => {
      if (!data) return;
      setRoom({
        code: data.code || '',
        host: data.host || '',
        players: Array.isArray(data.players) ? data.players : []
      });
    };

    const handleRoomError = (payload: SocketErrorPayload) => {
      setLastError(payload?.message || '房间同步失败');
    };

    const handleGameError = (payload: SocketErrorPayload) => {
      setLastError(payload?.message || '牌局同步失败');
    };

    socket.on('connect', () => {
      setConnectionState('connected');
      setLastError('');
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('reconnect_attempt', () => {
      setConnectionState('reconnecting');
    });

    socket.on('room:snapshot', handleRoomSnapshot);
    socket.on('table:snapshot', handleTableSnapshot);
    socket.on('hostRoom', handleLegacyRoom);
    socket.on('joinRoom', handleLegacyRoom);
    socket.on('displayPossibleMoves', (moves: PossibleMoves | any) => {
      setGame({ possibleMoves: moves && typeof moves === 'object' ? moves : {} });
    });
    socket.on('gameBegin', () => setGame({ stage: '牌局开始', lastError: '', possibleMoves: {} }));
    socket.on('room:error', handleRoomError);
    socket.on('game:error', handleGameError);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect_attempt');
      socket.off('room:snapshot', handleRoomSnapshot);
      socket.off('table:snapshot', handleTableSnapshot);
      socket.off('hostRoom', handleLegacyRoom);
      socket.off('joinRoom', handleLegacyRoom);
      socket.off('displayPossibleMoves');
      socket.off('gameBegin');
      socket.off('room:error', handleRoomError);
      socket.off('game:error', handleGameError);
    };
  }, [applyRoomSnapshot, applyTableSnapshot, setConnectionState, setGame, setLastError, setRoom]);
}
