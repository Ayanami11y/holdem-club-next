import { create } from 'zustand';

type SessionState = {
  username: string;
  roomCode: string;
  setUsername: (username: string) => void;
  setRoomCode: (roomCode: string) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  username: '',
  roomCode: '',
  setUsername: (username) => set({ username }),
  setRoomCode: (roomCode) => set({ roomCode })
}));
