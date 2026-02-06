import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, Thermometer, Droplets, Wind } from 'lucide-react';

// Fix for default marker icons in React Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom pest marker icons by status
const createPestIcon = (status: string) => {
  const color = status === 'verified' ? 'hsl(142, 71%, 45%)' : status === 'rejected' ? 'hsl(0, 84%, 60%)' : 'hsl(45, 93%, 47%)';
  
  return L.divIcon({
    className: 'custom-pest-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 14px;">🐛</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
}

interface Detection {
  id: string;
  pest_type: string;
  crop_type: string;
  confidence: number;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  created_at: string;
  image_url?: string | null;
  notes?: string | null;
}

interface PestDetectionMapProps {
  detections: Detection[];
  center?: [number, number];
  zoom?: number;
  showWeather?: boolean;
  height?: string;
  isAdmin?: boolean;
}

// Component to recenter map when center changes
const MapRecenter = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Fetch weather data from Open-Meteo API
const fetchWeather = async (lat: number, lng: number): Promise<WeatherData | null> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
    );
    const data = await response.json();
    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
};

const PestDetectionMap = ({
  detections,
  center = [14.5995, 120.9842], // Default: Manila, Philippines
  zoom = 10,
  showWeather = true,
  height = '500px',
  isAdmin = false,
}: PestDetectionMapProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  // Filter detections with valid coordinates
  const validDetections = useMemo(
    () => detections.filter((d) => d.latitude && d.longitude),
    [detections]
  );

  // Calculate map center from detections if available
  const mapCenter = useMemo(() => {
    if (validDetections.length > 0) {
      const avgLat = validDetections.reduce((sum, d) => sum + (d.latitude || 0), 0) / validDetections.length;
      const avgLng = validDetections.reduce((sum, d) => sum + (d.longitude || 0), 0) / validDetections.length;
      return [avgLat, avgLng] as [number, number];
    }
    return center;
  }, [validDetections, center]);

  // Fetch weather for map center
  useEffect(() => {
    if (showWeather) {
      fetchWeather(mapCenter[0], mapCenter[1]).then(setWeather);
    }
  }, [mapCenter, showWeather]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      verified: 'bg-primary/20 text-primary border-primary/30',
      rejected: 'bg-destructive/20 text-destructive border-destructive/30',
      pending: 'bg-accent/20 text-accent-foreground border-accent/30',
    };
    return variants[status] || variants.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'rejected':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height }}>
      {/* Weather Overlay - positioned to not cover zoom controls */}
      {showWeather && weather && (
        <div className="absolute bottom-4 left-4 z-[1000] glass-card p-3 space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Current Weather</h4>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Thermometer className="w-3 h-3 text-primary" />
              <span>{weather.temperature}°C</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="w-3 h-3 text-primary" />
              <span>{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wind className="w-3 h-3 text-primary" />
              <span>{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      )}

      {/* Detection Stats Overlay */}
      <div className="absolute top-4 right-4 z-[1000] glass-card p-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="text-muted-foreground">
              Pending: {validDetections.filter((d) => d.status === 'pending').length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">
              Verified: {validDetections.filter((d) => d.status === 'verified').length}
            </span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <span className="text-muted-foreground">
                Rejected: {validDetections.filter((d) => d.status === 'rejected').length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapRecenter center={mapCenter} zoom={zoom} />
        
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Detection Markers */}
        {validDetections.map((detection) => (
          <Marker
            key={detection.id}
            position={[detection.latitude!, detection.longitude!]}
            icon={createPestIcon(detection.status)}
            eventHandlers={{
              click: () => setSelectedDetection(detection),
            }}
          >
            <Popup className="pest-popup">
              <div className="min-w-[200px] p-1">
                {detection.image_url && (
                  <img
                    src={detection.image_url}
                    alt={detection.pest_type}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground text-sm">
                    {detection.pest_type}
                  </h3>
                  <Badge className={`text-[10px] ${getStatusBadge(detection.status)}`}>
                    {getStatusIcon(detection.status)}
                    <span className="ml-1">{detection.status}</span>
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>🌱 Crop: {detection.crop_type}</p>
                  <p>📊 Confidence: {Math.round(detection.confidence * 100)}%</p>
                  <p>📅 {format(new Date(detection.created_at), 'MMM d, yyyy h:mm a')}</p>
                  {detection.location_name && <p>📍 {detection.location_name}</p>}
                  {detection.notes && (
                    <p className="italic mt-1 text-muted-foreground/70">"{detection.notes}"</p>
                  )}
                </div>
              </div>
            </Popup>

            {/* Detection radius circle for verified detections */}
            {detection.status === 'verified' && (
              <Circle
                center={[detection.latitude!, detection.longitude!]}
                radius={500}
                pathOptions={{
                  color: 'hsl(142, 71%, 45%)',
                  fillColor: 'hsl(142, 71%, 45%)',
                  fillOpacity: 0.1,
                  weight: 1,
                }}
              />
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* No Detections Message */}
      {validDetections.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1000]">
          <div className="text-center p-6">
            <p className="text-muted-foreground">No pest detections with location data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PestDetectionMap;
