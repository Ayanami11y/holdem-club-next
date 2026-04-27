export type RoomSettings = {
  smallBlind: number;
  bigBlind: number;
  startingStack: number;
  autoRebuy: boolean;
};

export type SeatSnapshot = {
  seatIndex: number;
  username: string;
  status: string;
  blind: string;
  stack: number;
  buyIns: number;
  dealer: boolean;
  allIn: boolean;
  folded: boolean;
  isChecked: boolean;
  currentBet: number;
};

export type HeroSnapshot = {
  username: string;
  stack: number;
  cards: string[];
  status: string;
  blind: string;
  currentBet: number;
  buyIns: number;
} | null;

export type TableSnapshot = {
  code: string;
  stage: string;
  pot: number;
  topBet: number;
  communityCards: string[];
  currentTurn: string;
  roundInProgress: boolean;
  players: SeatSnapshot[];
  playerCount: number;
  hero: HeroSnapshot;
};

export type RoomSnapshot = {
  code: string;
  host: string;
  players: string[];
  playerCount: number;
  canStart: boolean;
  settings: {
    blinds: {
      small: number;
      big: number;
    };
    buyIn: {
      startingStack: number;
      autoRebuy: boolean;
      autoRebuyStack: number;
    };
  };
  table: TableSnapshot;
};

export type SocketErrorPayload = {
  code: string;
  message: string;
};
