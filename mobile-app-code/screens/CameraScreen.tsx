/**
 * BantayAni Mobile - Camera Screen
 * Live pest detection with auto-capture functionality
 * 
 * Usage in Expo project with React Native
 * 
 * Install required packages:
 * npx expo install expo-camera expo-location
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { useCaptureStore } from '../store/captureStore';
import {
  getCurrentLocation,
  mockPestDetection,
} from '../services/uploadService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Crop type options
const CROP_TYPES = ['Rice', 'Corn', 'Vegetables', 'Sugarcane', 'Banana', 'Other'];

export default function CameraScreen() {
  const cameraRef = useRef<Camera>(null);
  
  // Camera states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState(FlashMode.off);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Detection states
  const [isAutoDetectEnabled, setIsAutoDetectEnabled] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [detectionStatus, setDetectionStatus] = useState<string>('Scanning...');
  const [lastDetection, setLastDetection] = useState<{
    pestType: string;
    confidence: number;
  } | null>(null);

  // Store
  const { addCapture, isOnline, pendingSyncCount } = useCaptureStore();

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Simulated auto-detection loop
  useEffect(() => {
    if (!isAutoDetectEnabled || isProcessing) return;

    const detectionInterval = setInterval(() => {
      // Simulate AI detection frame analysis
      const detection = mockPestDetection();
      
      if (detection.detected) {
        setDetectionStatus(`Detected: ${detection.pestType}`);
        setLastDetection({
          pestType: detection.pestType,
          confidence: detection.confidence,
        });
        
        // Auto-capture when pest is detected
        handleAutoCapture(detection.pestType, detection.confidence);
      } else {
        setDetectionStatus('Scanning for pests...');
        setLastDetection(null);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(detectionInterval);
  }, [isAutoDetectEnabled, isProcessing]);

  // Auto-capture handler
  const handleAutoCapture = useCallback(
    async (pestType: string, confidence: number) => {
      if (isProcessing || !cameraRef.current) return;

      setIsProcessing(true);
      Vibration.vibrate(200); // Haptic feedback

      try {
        // Capture photo
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // Get GPS location
        const location = await getCurrentLocation();

        // Save to store
        addCapture({
          imageUri: photo.uri,
          timestamp: new Date().toISOString(),
          gpsCoordinates: location,
          cropType: selectedCrop,
          detectedPest: pestType,
          aiConfidence: confidence,
        });

        Alert.alert(
          '🐛 Pest Detected!',
          `${pestType} detected with ${confidence.toFixed(1)}% confidence.\n\nImage saved ${
            isOnline ? 'and will be uploaded.' : 'locally. Sync when online.'
          }`,
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Capture error:', error);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, selectedCrop, isOnline, addCapture]
  );

  // Manual capture handler
  const handleManualCapture = async () => {
    if (isProcessing || !cameraRef.current) return;

    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      const location = await getCurrentLocation();

      // For manual capture, use a generic label
      addCapture({
        imageUri: photo.uri,
        timestamp: new Date().toISOString(),
        gpsCoordinates: location,
        cropType: selectedCrop,
        detectedPest: 'Manual Capture - Pending Analysis',
        aiConfidence: 0,
      });

      Alert.alert('Captured!', 'Image saved for manual review.');
    } catch (error) {
      console.error('Manual capture error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle camera
  const toggleCameraType = () => {
    setCameraType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  // Toggle flash
  const toggleFlash = () => {
    setFlashMode((current) =>
      current === FlashMode.off ? FlashMode.on : FlashMode.off
    );
  };

  // Permission handling
  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.permissionText}>Requesting camera access...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>
          Camera access denied. Please enable it in settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#4CAF50' : '#FF9800' },
              ]}
            />
            <Text style={styles.statusText}>
              {isOnline ? 'Online' : `Offline (${pendingSyncCount} pending)`}
            </Text>
          </View>

          <TouchableOpacity onPress={toggleFlash} style={styles.iconButton}>
            <Text style={styles.iconText}>
              {flashMode === FlashMode.on ? '⚡' : '💡'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          {/* Detection Status */}
          <View style={styles.detectionBox}>
            {lastDetection ? (
              <>
                <Text style={styles.detectionPest}>🐛 {lastDetection.pestType}</Text>
                <Text style={styles.detectionConfidence}>
                  {lastDetection.confidence.toFixed(1)}% confidence
                </Text>
              </>
            ) : (
              <Text style={styles.scanningText}>{detectionStatus}</Text>
            )}
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomBar}>
          {/* Crop Type Selector */}
          <View style={styles.cropSelector}>
            <Text style={styles.cropLabel}>Crop Type:</Text>
            <View style={styles.cropPills}>
              {CROP_TYPES.slice(0, 4).map((crop) => (
                <TouchableOpacity
                  key={crop}
                  style={[
                    styles.cropPill,
                    selectedCrop === crop && styles.cropPillActive,
                  ]}
                  onPress={() => setSelectedCrop(crop)}
                >
                  <Text
                    style={[
                      styles.cropPillText,
                      selectedCrop === crop && styles.cropPillTextActive,
                    ]}
                  >
                    {crop}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Capture Controls */}
          <View style={styles.captureControls}>
            {/* Flip Camera */}
            <TouchableOpacity onPress={toggleCameraType} style={styles.sideButton}>
              <Text style={styles.sideButtonText}>🔄</Text>
            </TouchableOpacity>

            {/* Main Capture Button */}
            <TouchableOpacity
              style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
              onPress={handleManualCapture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#0a0f0a" size="small" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            {/* Auto-Detect Toggle */}
            <TouchableOpacity
              style={[
                styles.sideButton,
                isAutoDetectEnabled && styles.sideButtonActive,
              ]}
              onPress={() => setIsAutoDetectEnabled(!isAutoDetectEnabled)}
            >
              <Text style={styles.sideButtonText}>
                {isAutoDetectEnabled ? '🤖' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Auto-detect indicator */}
          <Text style={styles.autoDetectLabel}>
            {isAutoDetectEnabled
              ? '🟢 Auto-capture ON - Will snap when pest detected'
              : '🔴 Auto-capture OFF - Manual mode'}
          </Text>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f0a',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0f0a',
  },
  permissionText: {
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  scanFrame: {
    flex: 1,
    margin: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4CAF50',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4CAF50',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4CAF50',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4CAF50',
    borderBottomRightRadius: 8,
  },
  detectionBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  detectionPest: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detectionConfidence: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  scanningText: {
    color: '#fff',
    fontSize: 14,
  },
  bottomBar: {
    backgroundColor: 'rgba(10, 15, 10, 0.95)',
    paddingBottom: 40,
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cropSelector: {
    marginBottom: 16,
  },
  cropLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  cropPills: {
    flexDirection: 'row',
    gap: 8,
  },
  cropPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  cropPillActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  cropPillText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  cropPillTextActive: {
    color: '#0a0f0a',
  },
  captureControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginVertical: 12,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  sideButtonText: {
    fontSize: 22,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#0a0f0a',
  },
  autoDetectLabel: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
});
