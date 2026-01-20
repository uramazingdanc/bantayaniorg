import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, AlertCircle, Info, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdvisories } from '@/hooks/useAdvisories';
import { format } from 'date-fns';

const FarmerAdvisories = () => {
  const navigate = useNavigate();
  const { advisories, isLoading } = useAdvisories();

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-500/10 border-red-500/30',
          icon: AlertTriangle,
          iconColor: 'text-red-400',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30',
        };
      case 'high':
        return {
          bg: 'bg-orange-500/10 border-orange-500/30',
          icon: AlertCircle,
          iconColor: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30',
          icon: AlertCircle,
          iconColor: 'text-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30',
          icon: Info,
          iconColor: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 p-4">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/farmer')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Pest Advisories</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-md mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : advisories.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground mb-1">No advisories</h3>
            <p className="text-sm text-muted-foreground">
              No pest advisories have been issued yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {advisories.map((advisory) => {
              const styles = getSeverityStyles(advisory.severity);
              const Icon = styles.icon;

              return (
                <div 
                  key={advisory.id}
                  className={`rounded-xl border p-4 ${styles.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-background/50 ${styles.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {advisory.title}
                        </h3>
                        <Badge className={`flex-shrink-0 ${styles.badge}`}>
                          {advisory.severity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {advisory.content}
                      </p>

                      {/* Affected Crops */}
                      {advisory.affected_crops?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {advisory.affected_crops.map((crop: string) => (
                            <Badge key={crop} variant="outline" className="text-xs">
                              {crop}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(advisory.created_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerAdvisories;
