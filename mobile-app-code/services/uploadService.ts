/**
 * BantayAni Mobile - Upload Service
 * Handles metadata packaging and API upload with offline support
 * 
 * Usage in Expo project with React Native
 */

import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { CaptureMetadata } from '../store/captureStore';

// API Configuration - Replace with your actual backend URL
const API_BASE_URL = 'https://your-bantayani-api.com';
const API_ENDPOINT = '/api/detections';

export interface UploadPayload {
  imageBase64: string;
  metadata: {
    timestamp: string;
    gps: {
      latitude: number;
      longitude: number;
    } | null;
    cropType: string;
    pestType: string;
    aiConfidence: number;
    farmerId: string;
    deviceInfo: {
      platform: string;
      version: string;
    };
  };
}

/**
 * Get current GPS location
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('Location permission not granted');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

/**
 * Convert image URI to base64
 */
export async function imageToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Package capture metadata for upload
 */
export function packageCaptureData(
  capture: CaptureMetadata,
  imageBase64: string,
  farmerId: string
): UploadPayload {
  return {
    imageBase64,
    metadata: {
      timestamp: capture.timestamp,
      gps: capture.gpsCoordinates
        ? {
            latitude: capture.gpsCoordinates.lat,
            longitude: capture.gpsCoordinates.lng,
          }
        : null,
      cropType: capture.cropType,
      pestType: capture.detectedPest,
      aiConfidence: capture.aiConfidence,
      farmerId,
      deviceInfo: {
        platform: 'expo',
        version: '1.0.0',
      },
    },
  };
}

/**
 * Upload capture to backend API
 */
export async function uploadCapture(
  capture: CaptureMetadata,
  farmerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert image to base64
    const imageBase64 = await imageToBase64(capture.imageUri);

    // Package the data
    const payload = packageCaptureData(capture, imageBase64, farmerId);

    // Make API request
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token here if needed
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Batch sync all pending captures
 */
export async function syncPendingCaptures(
  pendingCaptures: CaptureMetadata[],
  farmerId: string,
  onProgress?: (synced: number, total: number) => void,
  onCaptureSuccess?: (captureId: string) => void
): Promise<{ successCount: number; failedCount: number }> {
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < pendingCaptures.length; i++) {
    const capture = pendingCaptures[i];
    const result = await uploadCapture(capture, farmerId);

    if (result.success) {
      successCount++;
      onCaptureSuccess?.(capture.id);
    } else {
      failedCount++;
    }

    onProgress?.(i + 1, pendingCaptures.length);
  }

  return { successCount, failedCount };
}

/**
 * Mock pest detection (simulate AI inference)
 * In production, this would call your ML model
 */
export function mockPestDetection(): {
  detected: boolean;
  pestType: string;
  confidence: number;
} {
  // Simulated detection results
  const pests = [
    { name: 'Rice Stem Borer', probability: 0.3 },
    { name: 'Fall Armyworm', probability: 0.25 },
    { name: 'Brown Planthopper', probability: 0.2 },
    { name: 'Aphids', probability: 0.15 },
    { name: 'Leaf Folder', probability: 0.1 },
  ];

  // Random detection (30% chance)
  const shouldDetect = Math.random() < 0.3;

  if (!shouldDetect) {
    return {
      detected: false,
      pestType: 'None',
      confidence: 0,
    };
  }

  // Select a random pest
  const randomPest = pests[Math.floor(Math.random() * pests.length)];
  const confidence = 70 + Math.random() * 25; // 70-95% confidence

  return {
    detected: true,
    pestType: randomPest.name,
    confidence,
  };
}
