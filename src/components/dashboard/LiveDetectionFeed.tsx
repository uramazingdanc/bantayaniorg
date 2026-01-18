import { DetectionCard } from './DetectionCard';
import { Inbox, Filter, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDetections } from '@/hooks/useDetections';
import type { Database } from '@/integrations/supabase/types';

type DetectionStatus = Database['public']['Enums']['detection_status'];

export const LiveDetectionFeed = () => {
  const { detections, isLoading, updateDetectionStatus } = useDetections(true);
  const [filter, setFilter] = useState<'all' | DetectionStatus>('all');

  const filteredDetections = detections.filter(
    (d) => filter === 'all' || d.status === filter
  );

  if (isLoading) {
    return (
      <div className="glass-card p-5 h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Live Detection Feed</h3>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            {filteredDetections.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-muted-foreground mr-1" />
          {(['all', 'pending', 'verified', 'rejected'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredDetections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Inbox className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No detections to show</p>
          </div>
        ) : (
          filteredDetections.map((detection) => (
            <DetectionCard 
              key={detection.id} 
              detection={detection} 
              onUpdateStatus={updateDetectionStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};
