import { create } from 'zustand';
import type { TableSnapshot, SeatSnapshot, HeroSnapshot } from '../types/socket';

export type PossibleMoves = Record<string, string | number>;

export type GameState = {
  code: string;
  stage: string;
  pot: number;
  topBet: number;
  communityCards: string[];
  heroCards: string[];
  hero: HeroSnapshot;
  currentTurn: string;
  roundInProgress: boolean;
  players: SeatSnapshot[];
  possibleMoves: PossibleMoves;
  lastError: string;
  connectionState: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
  setGame: (partial: Partial<GameState>) => void;
  applySnapshot: (snapshot: TableSnapshot) => void;
  setConnectionState: (state: GameState['connectionState']) => void;
  setLastError: (message: string) => void;
};

const initialState = {
  code: '',
  stage: '等待开局',
  pot: 0,
  topBet: 0,
  communityCards: [],
  heroCards: [],
  hero: null,
  currentTurn: '',
  roundInProgress: false,
  players: [],
  possibleMoves: {},
  lastError: '',
  connectionState: 'connecting' as const,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  setGame: (partial) => set((state) => ({ ...state, ...partial })),
  applySnapshot: (snapshot) =>
    set({
      code: snapshot.code || '',
      stage: snapshot.stage || '等待开局',
      pot: Number(snapshot.pot || 0),
      topBet: Number(snapshot.topBet || 0),
      communityCards: Array.isArray(snapshot.communityCards) ? snapshot.communityCards : [],
      heroCards: Array.isArray(snapshot.hero?.cards) ? snapshot.hero.cards : [],
      hero: snapshot.hero ?? null,
      currentTurn: snapshot.currentTurn || '',
      roundInProgress: Boolean(snapshot.roundInProgress),
      players: Array.isArray(snapshot.players) ? snapshot.players : [],
    }),
  setConnectionState: (connectionState) => set({ connectionState }),
  setLastError: (lastError) => set({ lastError }),
}));
