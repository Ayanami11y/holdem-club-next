import { create } from 'zustand';

export type RoomSettings = {
  smallBlind: number;
  bigBlind: number;
  startingStack: number;
  autoRebuy: boolean;
};

type RoomState = {
  code: string;
  host: string;
  players: string[];
  settings: RoomSettings;
  setRoom: (partial: Partial<RoomState>) => void;
};

export const defaultSettings: RoomSettings = {
  smallBlind: 1,
  bigBlind: 2,
  startingStack: 100,
  autoRebuy: true
};

export const useRoomStore = create<RoomState>((set) => ({
  code: '',
  host: '',
  players: [],
  settings: defaultSettings,
  setRoom: (partial) => set((state) => ({ ...state, ...partial }))
}));
