import { Map as MapIcon, AlertCircle, Loader2 } from 'lucide-react';
import { useDetections } from '@/hooks/useDetections';
import PestDetectionMap from '@/components/map/PestDetectionMap';

const GISMap = () => {
  const { detections, isLoading } = useDetections(true); // Admin sees all detections

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">GIS Map</h1>
        <p className="text-muted-foreground">
          Geographic distribution of pest detections across all farms
        </p>
      </div>

      {/* Map Container */}
      <div className="glass-card p-1 h-[600px] relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading detections...</span>
            </div>
          </div>
        ) : (
          <PestDetectionMap
            detections={detections}
            height="100%"
            isAdmin={true}
            showWeather={true}
          />
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-xl font-bold text-foreground">
                {detections.filter((d) => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verified Outbreaks</p>
              <p className="text-xl font-bold text-foreground">
                {detections.filter((d) => d.status === 'verified').length}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Locations</p>
              <p className="text-xl font-bold text-foreground">
                {detections.filter((d) => d.latitude && d.longitude).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISMap;
