import { useState } from 'react';
import { Search, Download, Loader2, Bug, MapPin, Calendar, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDetections, DetectionWithProfile } from '@/hooks/useDetections';
import { format } from 'date-fns';

const PestReports = () => {
  const { detections, isLoading } = useDetections(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('verified');
  const [cropFilter, setCropFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<DetectionWithProfile | null>(null);

  // Filter to only show verified or rejected reports (not pending)
  const processedDetections = detections.filter(d => d.status !== 'pending');

  const filteredDetections = processedDetections.filter((d) => {
    const matchesSearch =
      d.pest_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.farmer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesCrop = cropFilter === 'all' || d.crop_type === cropFilter;
    return matchesSearch && matchesStatus && matchesCrop;
  });

  const uniqueCrops = [...new Set(processedDetections.map((d) => d.crop_type))];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      verified: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return variants[status] || 'bg-muted text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pest Reports</h1>
          <p className="text-muted-foreground">Processed pest detection reports from farmers</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by pest type or farmer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 input-dark"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-11 input-dark">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cropFilter} onValueChange={setCropFilter}>
          <SelectTrigger className="w-[150px] h-11 input-dark">
            <SelectValue placeholder="Crop Type" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Crops</SelectItem>
            {uniqueCrops.map((crop) => (
              <SelectItem key={crop} value={crop}>{crop}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredDetections.length} of {processedDetections.length} processed reports
      </p>

      {filteredDetections.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bug className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium text-foreground mb-1">No processed reports</h3>
          <p className="text-sm text-muted-foreground">
            Verified and rejected reports will appear here
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDetections.map((detection) => (
            <div
              key={detection.id}
              onClick={() => setSelectedReport(detection)}
              className="glass-card-hover p-4 cursor-pointer"
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={detection.image_url || '/placeholder.svg'}
                    alt={detection.pest_type}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground truncate">
                        {detection.pest_type}
                      </h4>
                      <p className="text-sm text-muted-foreground">{detection.farmer_name}</p>
                    </div>
                    <Badge className={`flex-shrink-0 ${getStatusBadge(detection.status)}`}>
                      {detection.status}
                    </Badge>
                  </div>

                  {/* Metadata */}
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(detection.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{detection.crop_type} • {(Number(detection.confidence) * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Farmer Notes Indicator */}
                  {(detection as any).farmer_notes && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                      <MessageSquare className="w-3 h-3" />
                      <span>Has farmer comment</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-primary" />
                  {selectedReport.pest_type}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  {/* Image */}
                  <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                    <img 
                      src={selectedReport.image_url || '/placeholder.svg'} 
                      alt={selectedReport.pest_type}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Status & Confidence */}
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusBadge(selectedReport.status)}>
                      {selectedReport.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {(Number(selectedReport.confidence) * 100).toFixed(0)}% confidence
                    </span>
                  </div>

                  {/* Farmer Info */}
                  <div className="glass-card p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Submitted by</p>
                    <p className="text-sm text-foreground">{selectedReport.farmer_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedReport.farmer_email}</p>
                  </div>

                  {/* Details */}
                  <div className="glass-card p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Crop Type</p>
                    <p className="text-sm text-foreground">{selectedReport.crop_type}</p>
                  </div>

                  {/* Location */}
                  {(selectedReport.location_name || (selectedReport.latitude && selectedReport.longitude)) && (
                    <div className="glass-card p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Location</p>
                      {selectedReport.location_name && (
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedReport.location_name}
                        </p>
                      )}
                      {selectedReport.latitude && selectedReport.longitude && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Coordinates: {Number(selectedReport.latitude).toFixed(6)}, {Number(selectedReport.longitude).toFixed(6)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="glass-card p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Timeline</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Submitted</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(selectedReport.created_at), 'MMMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      {selectedReport.verified_at && (
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${
                            selectedReport.status === 'verified' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {selectedReport.status === 'verified' ? 'Verified' : 'Rejected'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(selectedReport.verified_at), 'MMMM d, yyyy • h:mm a')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Farmer Notes/Comments */}
                  {(selectedReport as any).farmer_notes && (
                    <div className="glass-card p-3 border-l-4 border-blue-400">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Farmer's Comment</p>
                      <p className="text-sm text-foreground italic">
                        "{(selectedReport as any).farmer_notes}"
                      </p>
                    </div>
                  )}

                  {/* LGU Notes */}
                  {selectedReport.notes && (
                    <div className="glass-card p-3 border-l-4 border-primary">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">LGU Response</p>
                      <p className="text-sm text-foreground">{selectedReport.notes}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PestReports;
