import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Camera,
  Bug,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Wifi,
  WifiOff,
  Send,
  Navigation,
  X,
  Flashlight,
  FlashlightOff,
  Upload,
  ImagePlus,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useDetections } from '@/hooks/useDetections';
import { useFarmerFarms } from '@/hooks/useFarmerFarms';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CROP_OPTIONS = [
  'Onion', 'Rice', 'Corn', 'Coconut', 'Sugarcane', 'Banana',
  'Mango', 'Vegetables', 'Coffee', 'Cacao', 'Other'
];

// Mock pest detection results
const MOCK_PESTS = [
  { name: 'Rice Stem Borer', scientific: 'Scirpophaga incertulas' },
  { name: 'Brown Planthopper', scientific: 'Nilaparvata lugens' },
  { name: 'Fall Armyworm', scientific: 'Spodoptera frugiperda' },
  { name: 'Beet Armyworm', scientific: 'Spodoptera exigua' },
  { name: 'Leaf Folder', scientific: 'Cnaphalocrocis medinalis' },
];

type ScanStep = 'location' | 'camera' | 'diagnosis' | 'success';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface DetectionResult {
  pest: string;
  scientific_name: string;
  confidence: number;
}

interface CapturedImage {
  id: string;
  dataUrl: string;
  detection?: DetectionResult;
}

interface ReportData {
  location: LocationData | null;
  images: CapturedImage[];
  cropType: string;
  farmerNotes: string;
  timestamp: string;
  selectedFarmNumber: number | null;
}

export const PestScanFlow = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow state
  const [currentStep, setCurrentStep] = useState<ScanStep>('location');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Camera controls
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);

  // Report data
  const [reportData, setReportData] = useState<ReportData>({
    location: null,
    images: [],
    cropType: 'Rice',
    farmerNotes: '',
    timestamp: '',
    selectedFarmNumber: null,
  });

  // UI states
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadDetection } = useDetections();
  const { farms, isLoading: farmsLoading } = useFarmerFarms();

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

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Step 1: Get Location
  const requestLocation = useCallback(async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      setShowLocationModal(true);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      setReportData(prev => ({
        ...prev,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
      }));

      toast.success('Location captured successfully!');
      setCurrentStep('camera');
    } catch (error: any) {
      let errorMessage = 'Unable to get your location';
      if (error.code === 1) {
        errorMessage = 'Location permission denied. Please enable GPS access.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your GPS settings.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }
      setLocationError(errorMessage);
      setShowLocationModal(true);
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  // Use farm location instead of GPS
  const useFarmLocation = (farmNumber: number) => {
    const farm = farms.find(f => f.farm_number === farmNumber);
    if (farm && farm.latitude && farm.longitude) {
      setReportData(prev => ({
        ...prev,
        location: {
          latitude: farm.latitude!,
          longitude: farm.longitude!,
          accuracy: 0,
        },
        selectedFarmNumber: farmNumber,
      }));
      toast.success(`Using ${farm.farm_name || `Farm ${farmNumber}`} location`);
      setCurrentStep('camera');
    } else {
      toast.error('This farm has no GPS coordinates saved');
    }
  };

  // Step 2: Start Camera with better permission handling
  const startCamera = useCallback(async () => {
    try {
      // First check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this browser. Please use a modern browser.');
        return;
      }

      // Request camera permission explicitly
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);

        // Check if torch/flash is supported
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        if (capabilities && 'torch' in capabilities) {
          setFlashSupported(true);
        } else {
          setFlashSupported(false);
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera access denied. Please allow camera permission in your browser settings, then refresh the page.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is being used by another application. Please close other apps using the camera.');
      } else if (error.name === 'OverconstrainedError') {
        // Try again with simpler constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            streamRef.current = simpleStream;
            setIsStreaming(true);
          }
        } catch (retryError) {
          toast.error('Unable to access camera. Please check your permissions.');
        }
      } else {
        toast.error(`Camera error: ${error.message || 'Unable to access camera'}`);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
      setFlashEnabled(false);
    }
  }, []);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;
    
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashEnabled } as any]
      });
      setFlashEnabled(!flashEnabled);
    } catch (error) {
      toast.error('Flash not supported on this device');
    }
  }, [flashEnabled]);

  // Start camera when entering camera step
  useEffect(() => {
    if (currentStep === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [currentStep, startCamera, stopCamera]);

  const MAX_IMAGES = 4;

  // Capture photo (max 4 images)
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    if (reportData.images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const newImage: CapturedImage = {
      id: crypto.randomUUID(),
      dataUrl,
    };

    setReportData(prev => ({
      ...prev,
      images: [...prev.images, newImage].slice(0, MAX_IMAGES),
      timestamp: new Date().toISOString(),
    }));

    toast.success(`Photo captured! (${reportData.images.length + 1}/${MAX_IMAGES})`);
  }, [reportData.images.length]);

  // Handle file upload for bulk images (max 4)
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentCount = reportData.images.length;
    const availableSlots = MAX_IMAGES - currentCount;

    if (availableSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      e.target.value = '';
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    
    if (files.length > availableSlots) {
      toast.warning(`Only ${availableSlots} more image(s) can be added (max ${MAX_IMAGES})`);
    }

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newImage: CapturedImage = {
          id: crypto.randomUUID(),
          dataUrl,
        };
        setReportData(prev => ({
          ...prev,
          images: [...prev.images, newImage].slice(0, MAX_IMAGES),
        }));
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${filesToProcess.length} image(s) added`);
    e.target.value = ''; // Reset input
  }, [reportData.images.length]);

  // Remove image
  const removeImage = (imageId: string) => {
    setReportData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId),
    }));
  };

  // Proceed to diagnosis
  const proceedToDiagnosis = () => {
    if (reportData.images.length === 0) {
      toast.error('Please capture or upload at least one image');
      return;
    }
    stopCamera();
    processImages();
  };

  // Step 3: Real AI Processing via detect-pest edge function
  const processImages = useCallback(async () => {
    setIsProcessing(true);

    try {
      const updatedImages: CapturedImage[] = [];

      for (const img of reportData.images) {
        try {
          // Call the detect-pest edge function
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-pest`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                image_base64: img.dataUrl,
                crop_type: reportData.cropType,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('AI detection error:', errorData);
            // Use fallback for this image
            updatedImages.push({
              ...img,
              detection: {
                pest: 'Unknown',
                scientific_name: 'Analysis failed',
                confidence: 0,
              },
            });
            continue;
          }

          const result = await response.json();
          
          if (result.success && result.detection) {
            updatedImages.push({
              ...img,
              detection: {
                pest: result.detection.pest_type || 'None detected',
                scientific_name: result.detection.scientific_name || '',
                confidence: result.detection.confidence || 0,
              },
            });
          } else {
            updatedImages.push({
              ...img,
              detection: {
                pest: 'No pest detected',
                scientific_name: '',
                confidence: 0,
              },
            });
          }
        } catch (error) {
          console.error('Error analyzing image:', error);
          updatedImages.push({
            ...img,
            detection: {
              pest: 'Analysis error',
              scientific_name: 'Please try again',
              confidence: 0,
            },
          });
        }
      }

      setReportData(prev => ({
        ...prev,
        images: updatedImages,
      }));

      setCurrentStep('diagnosis');
      toast.success('AI analysis complete!');
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to analyze images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [reportData.images, reportData.cropType]);

  // Step 4: Submit Report
  const submitReport = useCallback(async () => {
    if (!reportData.location || reportData.images.length === 0) {
      toast.error('Missing required data');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the farm ID if a farm was selected
      let farmId: string | undefined;
      if (reportData.selectedFarmNumber) {
        const selectedFarm = farms.find(f => f.farm_number === reportData.selectedFarmNumber);
        farmId = selectedFarm?.id;
      }

      // Submit each image as a separate detection
      for (const image of reportData.images) {
        if (!image.detection) continue;
        
        await uploadDetection({
          pest_type: image.detection.pest,
          confidence: image.detection.confidence,
          crop_type: reportData.cropType,
          latitude: reportData.location.latitude,
          longitude: reportData.location.longitude,
          image_base64: image.dataUrl,
          farmer_notes: reportData.farmerNotes,
          farm_id: farmId,
        });
      }

      setCurrentStep('success');
    } catch (error) {
      // Save offline if upload fails
      const pendingUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
      pendingUploads.push(reportData);
      localStorage.setItem('pendingUploads', JSON.stringify(pendingUploads));
      toast.info('Saved offline. Will sync when connected.');
      setCurrentStep('success');
    } finally {
      setIsSubmitting(false);
    }
  }, [reportData, uploadDetection, farms]);

  // Retake photos
  const retakePhotos = () => {
    setReportData(prev => ({
      ...prev,
      images: [],
    }));
    setCurrentStep('camera');
  };

  // Reset flow
  const resetFlow = () => {
    setReportData({
      location: null,
      images: [],
      cropType: 'Rice',
      farmerNotes: '',
      timestamp: '',
      selectedFarmNumber: null,
    });
    setCurrentStep('location');
    setLocationError(null);
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {(['location', 'camera', 'diagnosis', 'success'] as ScanStep[]).map((step, index) => (
        <div
          key={step}
          className={cn(
            'w-3 h-3 rounded-full transition-all',
            currentStep === step
              ? 'bg-primary scale-125'
              : index < ['location', 'camera', 'diagnosis', 'success'].indexOf(currentStep)
              ? 'bg-primary/60'
              : 'bg-muted'
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => navigate('/farmer')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg">Pest Scan</h1>
        <div className="flex items-center gap-2">
          {/* Chat with Admin Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/farmer/messages')}
            className="relative"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Badge variant="outline" className={cn(
            isOnline ? 'text-green-500 border-green-500/50' : 'text-red-500 border-red-500/50'
          )}>
            {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* STEP 1: LOCATION */}
        {currentStep === 'location' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
            <StepIndicator />
            
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <MapPin className="w-16 h-16 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Select Location</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-sm">
              Choose your farm location or use GPS to track the pest outbreak.
            </p>

            <div className="w-full max-w-sm space-y-4">
              <Select
                value={reportData.cropType}
                onValueChange={(value) => setReportData(prev => ({ ...prev, cropType: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Crop Type" />
                </SelectTrigger>
                <SelectContent>
                  {CROP_OPTIONS.map((crop) => (
                    <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Farm Location Options */}
              {farms.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Use saved farm location:</Label>
                  <div className="grid gap-2">
                    {farms.map((farm) => (
                      <Button
                        key={farm.id}
                        variant="outline"
                        className="w-full justify-start h-auto py-3"
                        onClick={() => useFarmLocation(farm.farm_number)}
                        disabled={!farm.latitude || !farm.longitude}
                      >
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mr-3">
                          {farm.farm_number}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{farm.farm_name || `Farm ${farm.farm_number}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {farm.address || (farm.latitude ? `${farm.latitude.toFixed(4)}, ${farm.longitude?.toFixed(4)}` : 'No GPS saved')}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                className="w-full h-14 text-lg btn-primary-glow"
                onClick={requestLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mr-2" />
                    Use Current GPS Location
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CAMERA */}
        {currentStep === 'camera' && (
          <div className="flex-1 relative animate-fade-in">
            <StepIndicator />
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Scanning Overlay */}
            {isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-72 h-72 border-2 border-primary rounded-2xl relative">
                  <div className="absolute inset-0 border-2 border-primary/30 rounded-2xl animate-ping" />
                  <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                </div>
              </div>
            )}

            {/* Top Controls */}
            <div className="absolute top-16 left-4 right-4 flex justify-between items-start">
              {/* Location Badge */}
              {reportData.location && (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                  <MapPin className="w-3 h-3 mr-1" />
                  {reportData.selectedFarmNumber 
                    ? `Farm ${reportData.selectedFarmNumber}`
                    : `${reportData.location.latitude.toFixed(4)}, ${reportData.location.longitude.toFixed(4)}`
                  }
                </Badge>
              )}
              
              {/* Flash Toggle with Label */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "bg-background/80 backdrop-blur",
                    flashEnabled && "bg-yellow-500/80"
                  )}
                  onClick={toggleFlash}
                  disabled={!flashSupported}
                >
                  {flashEnabled ? (
                    <Flashlight className="w-5 h-5 text-yellow-900" />
                  ) : (
                    <FlashlightOff className="w-5 h-5" />
                  )}
                </Button>
                <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-full">
                  {flashSupported ? (flashEnabled ? 'Flash On' : 'Flash Off') : 'No Flash'}
                </span>
              </div>
            </div>

            {/* Captured Images Preview */}
            {reportData.images.length > 0 && (
              <div className="absolute top-28 left-4 right-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {reportData.images.map((img) => (
                    <div key={img.id} className="relative flex-shrink-0">
                      <img 
                        src={img.dataUrl} 
                        alt="Captured" 
                        className="w-16 h-16 rounded-lg object-cover border-2 border-white"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
              <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full flex items-center gap-2">
                <Bug className="w-4 h-4" />
                {reportData.images.length === 0 
                  ? 'Capture or upload up to 4 images'
                  : `${reportData.images.length}/${MAX_IMAGES} images`
                }
              </p>

              <div className="flex items-center gap-4">
                {/* Upload Images Button with Label */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={reportData.images.length >= MAX_IMAGES}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center",
                      reportData.images.length >= MAX_IMAGES
                        ? "bg-white/10 backdrop-blur"
                        : "bg-white/20 backdrop-blur hover:bg-white/30"
                    )}
                  >
                    <Upload className="w-6 h-6 text-white" />
                  </button>
                  <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-full">
                    Upload
                  </span>
                </div>

                {/* Capture Button */}
                <button
                  onClick={capturePhoto}
                  disabled={!isStreaming || reportData.images.length >= MAX_IMAGES}
                  className="w-20 h-20 rounded-full bg-white border-4 border-primary flex items-center justify-center disabled:opacity-50 shadow-lg"
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary-foreground" />
                  </div>
                </button>

                {/* Proceed Button with Label */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={proceedToDiagnosis}
                    disabled={reportData.images.length === 0}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center",
                      reportData.images.length > 0 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-white/20 backdrop-blur text-white/50"
                    )}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                  <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-full">
                    Analyze
                  </span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="text-center p-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyzing {reportData.images.length} Image(s)...</h3>
              <p className="text-muted-foreground">AI is detecting pest species</p>
            </div>
          </div>
        )}

        {/* STEP 3: DIAGNOSIS */}
        {currentStep === 'diagnosis' && reportData.images.length > 0 && (
          <div className="flex-1 flex flex-col p-4 animate-fade-in overflow-y-auto">
            <StepIndicator />
            
            <div className="flex-1 space-y-4">
              {/* Images with Detection Results */}
              {reportData.images.map((img, index) => (
                <div key={img.id} className="glass-card p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={img.dataUrl}
                        alt={`Captured ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {img.detection && (
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{img.detection.pest}</h3>
                        <p className="text-sm text-muted-foreground italic">
                          {img.detection.scientific_name}
                        </p>
                        <Badge variant="outline" className="mt-2 text-primary border-primary">
                          {Math.round(img.detection.confidence * 100)}% Confidence
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Location & Crop Info */}
              <div className="glass-card p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {reportData.selectedFarmNumber 
                        ? `Farm ${reportData.selectedFarmNumber}`
                        : `${reportData.location?.latitude.toFixed(4)}, ${reportData.location?.longitude.toFixed(4)}`
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{reportData.cropType}</span>
                  </div>
                </div>
              </div>

              {/* Farmer Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Additional Comments (Optional)</Label>
                <Textarea
                  placeholder="Describe what you observed, crop condition, or any other details..."
                  value={reportData.farmerNotes}
                  onChange={(e) => setReportData(prev => ({ ...prev, farmerNotes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={retakePhotos}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button
                  className="flex-1 btn-primary-glow"
                  onClick={submitReport}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {currentStep === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
            <StepIndicator />
            
            <div className="w-32 h-32 rounded-full bg-green-500/10 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>

            <h2 className="text-2xl font-bold text-center mb-2">Report Submitted!</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Your {reportData.images.length} pest report(s) have been sent to the LGU for verification.
            </p>

            <Badge variant="outline" className="text-yellow-500 border-yellow-500 text-lg px-4 py-2 mb-8">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Status: Pending Verification
            </Badge>

            <div className="w-full max-w-sm space-y-3">
              <Button className="w-full" onClick={() => navigate('/farmer/history')}>
                View My Reports
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" className="w-full" onClick={resetFlow}>
                Scan Another Pest
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Location Error Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Location Access Required
            </DialogTitle>
            <DialogDescription>
              {locationError || 'We need your farm coordinates to track pest outbreaks accurately.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">How to enable location:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Open your device settings</li>
                <li>Go to Privacy &amp; Location</li>
                <li>Enable location services</li>
                <li>Allow this app to access location</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowLocationModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => {
                setShowLocationModal(false);
                requestLocation();
              }}>
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PestScanFlow;
