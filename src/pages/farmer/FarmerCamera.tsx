import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Zap, ZapOff, RefreshCw, Wifi, WifiOff, Loader2, CheckCircle2, AlertTriangle, MapPin, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDetections } from '@/hooks/useDetections';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CROP_OPTIONS = [
  'Onion', 'Rice', 'Corn', 'Coconut', 'Sugarcane', 'Banana', 
  'Mango', 'Vegetables', 'Coffee', 'Cacao', 'Other'
];

// Target pests for detection
const TARGET_PESTS = [
  'Beet Armyworm',
  'Fall Armyworm', 
  'African Armyworm',
  'Maize Stalk Borer',
  'Rice Stem Borer',
  'Brown Planthopper',
  'Leaf Folder',
];

interface DetectionResult {
  detected: boolean;
  pest_type: string;
  scientific_name: string | null;
  confidence: number;
  life_stage: string | null;
  severity: string | null;
  description: string;
  recommendations: string[];
}

interface CapturedImage {
  dataUrl: string;
  timestamp: string;
  location: { lat: number; lng: number } | null;
  cropType: string;
  detection: DetectionResult | null;
}

const FarmerCamera = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cropType, setCropType] = useState('Onion');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const [pendingUploads, setPendingUploads] = useState<CapturedImage[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { uploadDetection } = useDetections();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  // Load pending uploads from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pendingUploads');
    if (saved) {
      setPendingUploads(JSON.parse(saved));
    }
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      toast.error('Unable to access camera');
      console.error('Camera error:', error);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Analyze image with AI
  const analyzeImage = async (imageBase64: string): Promise<DetectionResult | null> => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const { data, error } = await supabase.functions.invoke('detect-pest', {
        body: { 
          image_base64: imageBase64,
          crop_type: cropType,
        },
      });

      if (error) {
        console.error('AI analysis error:', error);
        setAnalysisError(error.message || 'Analysis failed');
        return null;
      }

      if (data?.detection) {
        return data.detection;
      }

      return null;
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError('Failed to analyze image');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Capture and analyze image
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera while processing
    stopCamera();

    const captured: CapturedImage = {
      dataUrl,
      timestamp: new Date().toISOString(),
      location,
      cropType,
      detection: null,
    };

    setCapturedImage(captured);

    // Analyze with AI if online
    if (isOnline) {
      const detection = await analyzeImage(dataUrl);
      setCapturedImage(prev => prev ? { ...prev, detection } : null);
    } else {
      setAnalysisError('Offline - AI analysis unavailable');
    }
  }, [cropType, location, stopCamera, isOnline]);

  // Auto-capture when AI detects something in continuous mode
  useEffect(() => {
    if (!autoDetect || !isStreaming || capturedImage || isAnalyzing) return;

    // Auto-capture every 5 seconds for analysis
    const interval = setInterval(() => {
      handleCapture();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoDetect, isStreaming, capturedImage, isAnalyzing, handleCapture]);

  // Upload or save offline
  const handleSubmit = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);

    const detection = capturedImage.detection;
    const pestType = detection?.detected ? detection.pest_type : 'Unknown';
    const confidence = detection?.confidence || 0;

    if (isOnline) {
      try {
        await uploadDetection({
          pest_type: pestType,
          confidence: confidence,
          crop_type: capturedImage.cropType,
          latitude: capturedImage.location?.lat,
          longitude: capturedImage.location?.lng,
          image_base64: capturedImage.dataUrl,
        });
        toast.success('Detection uploaded successfully!');
        navigate('/farmer');
      } catch (error) {
        toast.error('Upload failed, saved for later');
        saveOffline(capturedImage);
      }
    } else {
      saveOffline(capturedImage);
      toast.info('Saved offline - will sync when connected');
      navigate('/farmer');
    }

    setIsProcessing(false);
  };

  // Save for offline sync
  const saveOffline = (image: CapturedImage) => {
    const updated = [...pendingUploads, image];
    setPendingUploads(updated);
    localStorage.setItem('pendingUploads', JSON.stringify(updated));
  };

  // Sync pending uploads
  const handleSyncPending = async () => {
    if (!isOnline || pendingUploads.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;

    for (const upload of pendingUploads) {
      try {
        const detection = upload.detection;
        await uploadDetection({
          pest_type: detection?.detected ? detection.pest_type : 'Unknown',
          confidence: detection?.confidence || 0,
          crop_type: upload.cropType,
          latitude: upload.location?.lat,
          longitude: upload.location?.lng,
          image_base64: upload.dataUrl,
        });
        successCount++;
      } catch (error) {
        console.error('Sync failed for:', upload.timestamp);
      }
    }

    if (successCount > 0) {
      const remaining = pendingUploads.slice(successCount);
      setPendingUploads(remaining);
      localStorage.setItem('pendingUploads', JSON.stringify(remaining));
      toast.success(`Synced ${successCount} detection(s)`);
    }

    setIsProcessing(false);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisError(null);
    startCamera();
  };

  // Get severity color
  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const detection = capturedImage?.detection;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
        <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate('/farmer')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          {/* Online Status */}
          <Badge variant="outline" className={`${isOnline ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}`}>
            {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>

          {/* Pending Uploads Badge */}
          {pendingUploads.length > 0 && (
            <Badge 
              variant="outline" 
              className="text-yellow-400 border-yellow-400 cursor-pointer"
              onClick={handleSyncPending}
            >
              {pendingUploads.length} pending
            </Badge>
          )}
        </div>
      </div>

      {/* Camera View / Captured Image */}
      <div className="flex-1 relative">
        {capturedImage ? (
          <img 
            src={capturedImage.dataUrl} 
            alt="Captured" 
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scanning Overlay */}
            {autoDetect && isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-primary rounded-2xl relative">
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-2xl animate-ping" />
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-sm text-white bg-black/50 px-3 py-1 rounded-full flex items-center gap-2">
                      <Bug className="w-4 h-4" />
                      AI Pest Detection Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Analyzing Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Analyzing image...</p>
              <p className="text-sm text-gray-400">Detecting armyworm species</p>
            </div>
          </div>
        )}

        {/* Detection Result Overlay */}
        {capturedImage && !isAnalyzing && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
            <div className="glass-card p-4 max-w-md mx-auto">
              {detection?.detected ? (
                <>
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle2 className="w-8 h-8 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white">{detection.pest_type}</h3>
                      {detection.scientific_name && (
                        <p className="text-xs text-gray-400 italic">{detection.scientific_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-primary border-primary">
                          {Math.round(detection.confidence * 100)}% confidence
                        </Badge>
                        {detection.severity && (
                          <Badge variant="outline" className={getSeverityColor(detection.severity)}>
                            {detection.severity} severity
                          </Badge>
                        )}
                        {detection.life_stage && (
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            {detection.life_stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {detection.description && (
                    <p className="text-sm text-gray-300 mb-3">{detection.description}</p>
                  )}

                  {detection.recommendations?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Recommendations:</p>
                      <ul className="text-xs text-gray-300 list-disc list-inside">
                        {detection.recommendations.slice(0, 2).map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 mb-3">
                  {analysisError ? (
                    <>
                      <AlertTriangle className="w-8 h-8 text-yellow-400" />
                      <div>
                        <h3 className="font-semibold text-lg text-white">Analysis Issue</h3>
                        <p className="text-sm text-gray-300">{analysisError}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                      <div>
                        <h3 className="font-semibold text-lg text-white">No Pest Detected</h3>
                        <p className="text-sm text-gray-300">
                          {detection?.description || 'The image appears to be pest-free'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                <span>{cropType}</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString()}</span>
                {location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      GPS Captured
                    </span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleRetake}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button 
                  className="flex-1 btn-primary-glow" 
                  onClick={handleSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isOnline ? 'Upload Report' : 'Save Offline'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      {!capturedImage && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-md mx-auto space-y-4">
            {/* Crop Selector */}
            <div className="flex justify-center">
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CROP_OPTIONS.map((crop) => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Pests Info */}
            <div className="flex flex-wrap justify-center gap-1">
              {TARGET_PESTS.slice(0, 4).map((pest) => (
                <Badge key={pest} variant="outline" className="text-xs text-gray-400 border-gray-600">
                  {pest}
                </Badge>
              ))}
            </div>

            {/* Capture Controls */}
            <div className="flex items-center justify-center gap-6">
              {/* Auto-detect Toggle */}
              <button
                onClick={() => setAutoDetect(!autoDetect)}
                className={`p-3 rounded-full transition-colors ${
                  autoDetect ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white'
                }`}
              >
                {autoDetect ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
              </button>

              {/* Capture Button */}
              <button
                onClick={handleCapture}
                disabled={!isStreaming || isAnalyzing}
                className="w-20 h-20 rounded-full bg-white border-4 border-primary flex items-center justify-center disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
              </button>

              {/* Placeholder for symmetry */}
              <div className="w-12 h-12" />
            </div>

            <p className="text-center text-xs text-gray-400">
              {autoDetect ? 'AI auto-capture enabled • Detecting armyworm & pests' : 'Tap to capture and analyze'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerCamera;
