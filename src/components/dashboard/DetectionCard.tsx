import { formatDistanceToNow } from 'date-fns';
import { MapPin, Clock, Percent, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Detection, DetectionStatus, useDetectionStore } from '@/store/detectionStore';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface DetectionCardProps {
  detection: Detection;
  showActions?: boolean;
}

export const DetectionCard = ({ detection, showActions = true }: DetectionCardProps) => {
  const { updateStatus } = useDetectionStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status: DetectionStatus) => {
    setIsUpdating(true);
    await new Promise((r) => setTimeout(r, 500));
    updateStatus(detection.id, status);
    setIsUpdating(false);
  };

  const getStatusBadge = (status: DetectionStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="status-verified">
            <Check className="w-3 h-3" />
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="status-rejected">
            <X className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="status-pending">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="glass-card-hover p-4 animate-fade-in">
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={detection.imageUrl}
            alt={detection.pestType}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-1 right-1">
            {getStatusBadge(detection.status)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground truncate">
                {detection.pestType}
              </h4>
              <p className="text-sm text-muted-foreground">{detection.farmerName}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(detection.timestamp), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Percent className="w-3 h-3" />
              <span>{detection.aiConfidence.toFixed(1)}% confidence</span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {detection.gpsCoordinates.lat.toFixed(4)}, {detection.gpsCoordinates.lng.toFixed(4)} • {detection.cropType}
              </span>
            </div>
          </div>

          {/* Actions */}
          {showActions && detection.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs border-primary/50 text-primary hover:bg-primary/20"
                onClick={() => handleStatusUpdate('verified')}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Verify
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs border-destructive/50 text-destructive hover:bg-destructive/20"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                Reject
              </Button>
            </div>
          )}

          {/* Notes */}
          {detection.notes && (
            <p className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
              {detection.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
