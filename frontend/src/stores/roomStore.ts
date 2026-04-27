import { create } from 'zustand';
import type { RoomSnapshot, RoomSettings } from '../types/socket';

export type RoomState = {
  code: string;
  host: string;
  players: string[];
  playerCount: number;
  canStart: boolean;
  settings: RoomSettings;
  setRoom: (partial: Partial<RoomState>) => void;
  applySnapshot: (snapshot: RoomSnapshot) => void;
  resetRoom: () => void;
};

export const defaultSettings: RoomSettings = {
  smallBlind: 1,
  bigBlind: 2,
  startingStack: 100,
  autoRebuy: true,
};

const initialState = {
  code: '',
  host: '',
  players: [],
  playerCount: 0,
  canStart: false,
  settings: defaultSettings,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,
  setRoom: (partial) => set((state) => ({ ...state, ...partial })),
  applySnapshot: (snapshot) =>
    set({
      code: snapshot.code || '',
      host: snapshot.host || '',
      players: Array.isArray(snapshot.players) ? snapshot.players : [],
      playerCount: Number(snapshot.playerCount || 0),
      canStart: Boolean(snapshot.canStart),
      settings: {
        smallBlind: snapshot.settings?.blinds?.small ?? 1,
        bigBlind: snapshot.settings?.blinds?.big ?? 2,
        startingStack: snapshot.settings?.buyIn?.startingStack ?? 100,
        autoRebuy: snapshot.settings?.buyIn?.autoRebuy ?? true,
      },
    }),
  resetRoom: () => set(initialState),
}));
