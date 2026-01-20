import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, XCircle, MapPin, Calendar, Bug, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDetections } from '@/hooks/useDetections';
import { format } from 'date-fns';

const FarmerHistory = () => {
  const navigate = useNavigate();
  const { detections, isLoading } = useDetections(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  const filteredDetections = detections.filter(d => 
    filter === 'all' ? true : d.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      verified: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return variants[status] || variants.pending;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/farmer')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Detection History</h1>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3 max-w-md mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-md mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDetections.length === 0 ? (
          <div className="text-center py-12">
            <Bug className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground mb-1">No detections found</h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'all' 
                ? "Start scanning to see your detection history"
                : `No ${filter} detections`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDetections.map((detection) => (
              <div 
                key={detection.id} 
                className="glass-card p-4 flex gap-4"
              >
                {/* Image Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img 
                    src={detection.image_url || '/placeholder.svg'} 
                    alt={detection.pest_type}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">
                      {detection.pest_type}
                    </h3>
                    <Badge className={`flex-shrink-0 ${getStatusBadge(detection.status)}`}>
                      {getStatusIcon(detection.status)}
                      <span className="ml-1">{detection.status}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {detection.crop_type} • {Math.round(detection.confidence * 100)}% confidence
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(detection.created_at), 'MMM d, yyyy')}
                    </span>
                    {detection.location_name && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {detection.location_name}
                      </span>
                    )}
                  </div>

                  {detection.notes && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                      "{detection.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerHistory;
