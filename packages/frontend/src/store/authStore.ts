import { create } from 'zustand';
import { api } from '../services/api';
import { User, ApiResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Read saved state on boot
  const savedToken = localStorage.getItem('documind_token');
  const savedUserJson = localStorage.getItem('documind_user');
  let initialUser: User | null = null;
  if (savedUserJson) {
    try {
      initialUser = JSON.parse(savedUserJson);
    } catch {
      localStorage.removeItem('documind_user');
    }
  }

  return {
    user: initialUser,
    token: savedToken,
    isAuthenticated: !!savedToken,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', {
          email,
          password,
        });

        if (res.data.success && res.data.data) {
          const { user, token } = res.data.data;
          localStorage.setItem('documind_token', token);
          localStorage.setItem('documind_user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        } else {
          set({
            isLoading: false,
            error: res.data.error?.message || 'Login failed',
          });
        }
      } catch (err: any) {
        set({
          isLoading: false,
          error: err.response?.data?.error?.message || err.message || 'Login failed',
        });
        throw err;
      }
    },

    register: async (email: string, displayName: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', {
          email,
          displayName,
          password,
        });

        if (res.data.success && res.data.data) {
          const { user, token } = res.data.data;
          localStorage.setItem('documind_token', token);
          localStorage.setItem('documind_user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        } else {
          set({
            isLoading: false,
            error: res.data.error?.message || 'Registration failed',
          });
        }
      } catch (err: any) {
        set({
          isLoading: false,
          error: err.response?.data?.error?.message || err.message || 'Registration failed',
        });
        throw err;
      }
    },

    logout: () => {
      localStorage.removeItem('documind_token');
      localStorage.removeItem('documind_user');
      set({ user: null, token: null, isAuthenticated: false, error: null });
    },

    clearError: () => set({ error: null }),
  };
});
