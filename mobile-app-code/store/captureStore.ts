/**
 * BantayAni Mobile - Capture Store
 * Zustand state management for offline-first capture storage
 * 
 * Usage in Expo project with React Native
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CaptureMetadata {
  id: string;
  imageUri: string;
  timestamp: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  } | null;
  cropType: string;
  detectedPest: string;
  aiConfidence: number;
  isSynced: boolean;
  syncedAt?: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface CaptureState {
  captures: CaptureMetadata[];
  pendingSyncCount: number;
  isOnline: boolean;
  
  // Actions
  addCapture: (capture: Omit<CaptureMetadata, 'id' | 'isSynced' | 'status'>) => void;
  markAsSynced: (id: string) => void;
  updateStatus: (id: string, status: CaptureMetadata['status']) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  getPendingCaptures: () => CaptureMetadata[];
  clearSyncedCaptures: () => void;
}

export const useCaptureStore = create<CaptureState>()(
  persist(
    (set, get) => ({
      captures: [],
      pendingSyncCount: 0,
      isOnline: true,

      addCapture: (capture) => {
        const newCapture: CaptureMetadata = {
          ...capture,
          id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          isSynced: false,
          status: 'pending',
        };

        set((state) => ({
          captures: [newCapture, ...state.captures],
          pendingSyncCount: state.pendingSyncCount + 1,
        }));
      },

      markAsSynced: (id) => {
        set((state) => ({
          captures: state.captures.map((c) =>
            c.id === id
              ? { ...c, isSynced: true, syncedAt: new Date().toISOString() }
              : c
          ),
          pendingSyncCount: Math.max(0, state.pendingSyncCount - 1),
        }));
      },

      updateStatus: (id, status) => {
        set((state) => ({
          captures: state.captures.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        }));
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
      },

      getPendingCaptures: () => {
        return get().captures.filter((c) => !c.isSynced);
      },

      clearSyncedCaptures: () => {
        set((state) => ({
          captures: state.captures.filter((c) => !c.isSynced),
        }));
      },
    }),
    {
      name: 'bantayani-captures',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
