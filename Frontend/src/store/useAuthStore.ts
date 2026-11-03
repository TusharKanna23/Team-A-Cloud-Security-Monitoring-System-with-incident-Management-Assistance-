import { create } from 'zustand';
import type { User, UserRole } from '../features/auth/types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  hasRole: (requiredRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token });
  },
  clearAuth: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null });
  },
  hasRole: (requiredRoles) => {
    const user = get().user;
    return user ? requiredRoles.includes(user.role) : false;
  },
}));