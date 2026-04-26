import { socket } from '../../lib/socket';
import type { RoomSettings } from '../../stores/roomStore';

export function hostRoom(username: string, settings: RoomSettings) {
  socket.emit('host', { username, settings: {
    smallBlind: settings.smallBlind,
    bigBlind: settings.bigBlind,
    startingStack: settings.startingStack,
    autoRebuy: settings.autoRebuy,
    autoRebuyStack: settings.startingStack
  } });
}

export function joinRoom(username: string, code: string) {
  socket.emit('join', { username, code });
}

export function startGame(code: string) {
  socket.emit('startGame', { code });
}
