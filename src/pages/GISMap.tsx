import { Map as MapIcon, AlertCircle } from 'lucide-react';
import { useDetectionStore } from '@/store/detectionStore';

const GISMap = () => {
  const { detections } = useDetectionStore();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">GIS Map</h1>
        <p className="text-muted-foreground">
          Geographic distribution of pest detections
        </p>
      </div>

      {/* Map Container */}
      <div className="glass-card p-1 h-[600px] relative overflow-hidden">
        {/* Placeholder Map */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center">
          <div className="text-center">
            <MapIcon className="w-16 h-16 text-primary/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Interactive GIS Map
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This area will display an interactive map with pest detection markers.
              Integration with Mapbox or Leaflet required.
            </p>
          </div>
        </div>

        {/* Detection Markers Legend */}
        <div className="absolute bottom-4 left-4 glass-card p-3 z-10">
          <h4 className="text-xs font-semibold text-foreground mb-2">
            Detection Points
          </h4>
          <div className="space-y-1.5">
            {detections.slice(0, 4).map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-xs">
                <div
                  className={`w-2 h-2 rounded-full ${
                    d.status === 'verified'
                      ? 'bg-primary'
                      : d.status === 'rejected'
                      ? 'bg-destructive'
                      : 'bg-yellow-500'
                  }`}
                />
                <span className="text-muted-foreground">
                  {d.pestType} - {d.cropType}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-4 right-4 glass-card p-3 z-10">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">
              {detections.length} Active Detection Points
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISMap;
