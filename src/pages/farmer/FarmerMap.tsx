import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDetections } from '@/hooks/useDetections';
import PestDetectionMap from '@/components/map/PestDetectionMap';

const FarmerMap = () => {
  const navigate = useNavigate();
  const { detections, isLoading } = useDetections(false); // Farmer sees only their detections

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/farmer')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Pest Detection Map</h1>
              <p className="text-xs text-muted-foreground">View your detection locations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="p-4 max-w-md mx-auto">
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <PestDetectionMap
              detections={detections}
              height="400px"
              isAdmin={false}
              showWeather={true}
            />
          )}
        </div>

        {/* Detection Summary */}
        <div className="mt-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Your Detection Summary</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {detections.filter((d) => d.latitude && d.longitude).length}
              </p>
              <p className="text-xs text-muted-foreground">Locations Mapped</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {detections.filter((d) => d.status === 'verified').length}
              </p>
              <p className="text-xs text-muted-foreground">Verified Detections</p>
            </div>
          </div>

          {/* Recent Detections List */}
          {detections.length > 0 && (
            <div className="glass-card p-3">
              <h3 className="text-xs font-semibold text-foreground mb-2">Recent Locations</h3>
              <div className="space-y-2">
                {detections
                  .filter((d) => d.latitude && d.longitude)
                  .slice(0, 3)
                  .map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground truncate flex-1">
                        {d.location_name || `${d.latitude?.toFixed(4)}, ${d.longitude?.toFixed(4)}`}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        d.status === 'verified' ? 'bg-primary/20 text-primary' :
                        d.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                        'bg-accent/20 text-accent-foreground'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerMap;
