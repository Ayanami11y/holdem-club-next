import { create } from 'zustand';

type GameState = {
  stage: string;
  pot: number;
  topBet: number;
  communityCards: string[];
  heroCards: string[];
  possibleMoves: string[];
  setGame: (partial: Partial<GameState>) => void;
};

export const useGameStore = create<GameState>((set) => ({
  stage: '等待开局',
  pot: 0,
  topBet: 0,
  communityCards: [],
  heroCards: [],
  possibleMoves: [],
  setGame: (partial) => set((state) => ({ ...state, ...partial }))
}));
