import { create } from 'zustand';

export type DetectionStatus = 'pending' | 'verified' | 'rejected';

export interface Detection {
  id: string;
  farmerId: string;
  farmerName: string;
  imageUrl: string;
  timestamp: string;
  gpsCoordinates: {
    lat: number;
    lng: number;
  };
  cropType: string;
  pestType: string;
  aiConfidence: number;
  status: DetectionStatus;
  notes?: string;
}

interface DetectionState {
  detections: Detection[];
  addDetection: (detection: Omit<Detection, 'id' | 'status'>) => void;
  updateStatus: (id: string, status: DetectionStatus, notes?: string) => void;
  getDetectionsByStatus: (status: DetectionStatus) => Detection[];
  getDetectionsByFarmer: (farmerId: string) => Detection[];
}

// Mock data for demonstration
const mockDetections: Detection[] = [
  {
    id: '1',
    farmerId: 'f1',
    farmerName: 'Juan dela Cruz',
    imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    gpsCoordinates: { lat: 7.1907, lng: 125.4553 },
    cropType: 'Rice',
    pestType: 'Rice Stem Borer',
    aiConfidence: 94.5,
    status: 'pending',
  },
  {
    id: '2',
    farmerId: 'f2',
    farmerName: 'Maria Santos',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    gpsCoordinates: { lat: 7.0731, lng: 125.6128 },
    cropType: 'Corn',
    pestType: 'Fall Armyworm',
    aiConfidence: 87.2,
    status: 'verified',
    notes: 'Confirmed Fall Armyworm infestation. Advisory sent to nearby farmers.',
  },
  {
    id: '3',
    farmerId: 'f3',
    farmerName: 'Pedro Garcia',
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    gpsCoordinates: { lat: 7.2046, lng: 125.4372 },
    cropType: 'Vegetables',
    pestType: 'Aphids',
    aiConfidence: 78.9,
    status: 'pending',
  },
  {
    id: '4',
    farmerId: 'f1',
    farmerName: 'Juan dela Cruz',
    imageUrl: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400&h=300&fit=crop',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    gpsCoordinates: { lat: 7.1907, lng: 125.4553 },
    cropType: 'Rice',
    pestType: 'Brown Planthopper',
    aiConfidence: 91.3,
    status: 'rejected',
    notes: 'Image quality too low for accurate identification.',
  },
];

export const useDetectionStore = create<DetectionState>((set, get) => ({
  detections: mockDetections,

  addDetection: (detection) => {
    const newDetection: Detection = {
      ...detection,
      id: crypto.randomUUID(),
      status: 'pending',
    };
    set((state) => ({
      detections: [newDetection, ...state.detections],
    }));
  },

  updateStatus: (id, status, notes) => {
    set((state) => ({
      detections: state.detections.map((d) =>
        d.id === id ? { ...d, status, notes: notes || d.notes } : d
      ),
    }));
  },

  getDetectionsByStatus: (status) => {
    return get().detections.filter((d) => d.status === status);
  },

  getDetectionsByFarmer: (farmerId) => {
    return get().detections.filter((d) => d.farmerId === farmerId);
  },
}));
