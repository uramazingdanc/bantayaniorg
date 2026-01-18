import { create } from 'zustand';

export type AdvisoryPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Advisory {
  id: string;
  title: string;
  content: string;
  pestType: string;
  affectedCrops: string[];
  affectedRegions: string[];
  priority: AdvisoryPriority;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

interface AdvisoryState {
  advisories: Advisory[];
  addAdvisory: (advisory: Omit<Advisory, 'id' | 'createdAt' | 'isActive'>) => void;
  updateAdvisory: (id: string, updates: Partial<Advisory>) => void;
  toggleActive: (id: string) => void;
  deleteAdvisory: (id: string) => void;
}

const mockAdvisories: Advisory[] = [
  {
    id: '1',
    title: 'Rice Stem Borer Alert - Davao Region',
    content: 'Increased Rice Stem Borer activity detected in multiple farms. Recommended actions: Apply approved pesticides, practice crop rotation, and report any sightings through the BantayAni app.',
    pestType: 'Rice Stem Borer',
    affectedCrops: ['Rice'],
    affectedRegions: ['Davao del Sur', 'Davao del Norte'],
    priority: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdBy: 'Admin',
    isActive: true,
  },
  {
    id: '2',
    title: 'Fall Armyworm Prevention Guidelines',
    content: 'Preventive measures for Fall Armyworm in corn fields. Monitor your crops regularly, especially during early morning hours. Use pheromone traps and biological control agents when available.',
    pestType: 'Fall Armyworm',
    affectedCrops: ['Corn', 'Sorghum'],
    affectedRegions: ['Davao Region', 'SOCCSKSARGEN'],
    priority: 'medium',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdBy: 'Admin',
    isActive: true,
  },
  {
    id: '3',
    title: 'Aphid Control in Vegetable Farms',
    content: 'Low-level aphid infestations reported. Recommend natural predators like ladybugs and regular inspection of leaf undersides.',
    pestType: 'Aphids',
    affectedCrops: ['Vegetables', 'Legumes'],
    affectedRegions: ['Davao del Sur'],
    priority: 'low',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    createdBy: 'Admin',
    isActive: false,
  },
];

export const useAdvisoryStore = create<AdvisoryState>((set) => ({
  advisories: mockAdvisories,

  addAdvisory: (advisory) => {
    const newAdvisory: Advisory = {
      ...advisory,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    set((state) => ({
      advisories: [newAdvisory, ...state.advisories],
    }));
  },

  updateAdvisory: (id, updates) => {
    set((state) => ({
      advisories: state.advisories.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  toggleActive: (id) => {
    set((state) => ({
      advisories: state.advisories.map((a) =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      ),
    }));
  },

  deleteAdvisory: (id) => {
    set((state) => ({
      advisories: state.advisories.filter((a) => a.id !== id),
    }));
  },
}));
