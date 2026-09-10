import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  token: string | null;
  teacher: { id: number; username: string; name: string | null } | null;
  setAuth: (token: string, teacher: { id: number; username: string; name: string | null }) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      teacher: null,
      setAuth: (token, teacher) => set({ token, teacher }),
      logout: () => set({ token: null, teacher: null }),
    }),
    { name: 'admin-storage' },
  ),
);
