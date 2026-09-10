import { create } from 'zustand';

interface PlayerState {
  name: string;
  grade: 7 | 8 | 9 | null;
  sessionId: string | null;
  setPlayer: (name: string, grade: 7 | 8 | 9) => void;
  setSessionId: (id: string | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  name: '',
  grade: null,
  sessionId: null,
  setPlayer: (name, grade) => set({ name, grade }),
  setSessionId: (id) => set({ sessionId: id }),
}));
