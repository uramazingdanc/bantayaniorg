import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'farmer' | 'lgu_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  farmDetails?: {
    location: string;
    size: string;
    mainCrop: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string, role: UserRole) => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        const mockUser: User = {
          id: crypto.randomUUID(),
          email,
          name: role === 'lgu_admin' ? 'Admin User' : 'Farmer User',
          role,
          farmDetails: role === 'farmer' ? {
            location: 'Davao Region',
            size: '2.5 hectares',
            mainCrop: 'Rice'
          } : undefined
        };
        
        set({ user: mockUser, isAuthenticated: true, isLoading: false });
      },

      signup: async (email: string, password: string, name: string, role: UserRole) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const mockUser: User = {
          id: crypto.randomUUID(),
          email,
          name,
          role,
          farmDetails: role === 'farmer' ? {
            location: '',
            size: '',
            mainCrop: ''
          } : undefined
        };
        
        set({ user: mockUser, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'bantayani-auth',
    }
  )
);
