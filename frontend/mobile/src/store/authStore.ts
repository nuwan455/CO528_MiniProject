import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.success && response.data) {
      const { accessToken, refreshToken, user } = response.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    }
  },

  register: async (data: any) => {
    const response = await api.register(data);
    if (response.success && response.data) {
      const { accessToken, refreshToken, user } = response.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch (error) {
      // Continue logout even if API call fails
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  loadUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (userStr && accessToken) {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true, isLoading: false });

        // Verify token is still valid
        try {
          const response = await api.getMe();
          if (response.success && response.data) {
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
            set({ user: response.data, isLoading: false });
          }
        } catch (error) {
          // Token invalid, clear auth
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  updateUser: (user: User) => {
    set({ user });
    AsyncStorage.setItem('user', JSON.stringify(user));
  },
}));
