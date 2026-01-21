import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  MapPin,
  Clock,
  Percent,
  Bug,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Bell,
  AlertTriangle,
  Leaf,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDetections, DetectionWithProfile } from '@/hooks/useDetections';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const REJECTION_REASONS = [
  'Blurry or unclear image',
  'Not a recognizable pest',
  'Image does not match the reported pest type',
  'Duplicate report',
  'Insufficient evidence',
  'Other',
];

export const VerificationQueue = () => {
  const { detections, isLoading, updateDetectionStatus, refetch } = useDetections(true);
  const [selectedDetection, setSelectedDetection] = useState<DetectionWithProfile | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionNote, setCustomRejectionNote] = useState('');
  const [requestInfoMessage, setRequestInfoMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [newReportCount, setNewReportCount] = useState(0);

  // Filter to show only pending detections in queue
  const pendingDetections = detections.filter((d) => d.status === 'pending');

  // Set up realtime subscription for new reports
  useEffect(() => {
    const channel = supabase
      .channel('new_pest_reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pest_detections',
        },
        (payload) => {
          console.log('New pest report received:', payload);
          toast.info('New Pest Report!', {
            description: `A farmer has submitted a new pest detection.`,
            action: {
              label: 'View',
              onClick: () => refetch(),
            },
          });
          setNewReportCount((prev) => prev + 1);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Auto-select first pending detection
  useEffect(() => {
    if (pendingDetections.length > 0 && !selectedDetection) {
      setSelectedDetection(pendingDetections[0]);
    } else if (pendingDetections.length === 0) {
      setSelectedDetection(null);
    }
  }, [pendingDetections, selectedDetection]);

  // Navigate through queue
  const currentIndex = selectedDetection
    ? pendingDetections.findIndex((d) => d.id === selectedDetection.id)
    : -1;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedDetection(pendingDetections[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < pendingDetections.length - 1) {
      setSelectedDetection(pendingDetections[currentIndex + 1]);
    }
  };

  // Action handlers
  const handleVerify = async () => {
    if (!selectedDetection) return;
    setIsUpdating(true);
    try {
      await updateDetectionStatus(selectedDetection.id, 'verified', 'Verified by LGU admin');
      toast.success('Detection verified! Farmer has been notified.');
      // Move to next item
      const nextIndex = Math.min(currentIndex, pendingDetections.length - 2);
      if (nextIndex >= 0 && pendingDetections[nextIndex + 1]) {
        setSelectedDetection(pendingDetections[nextIndex + 1]);
      } else {
        setSelectedDetection(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDetection) return;
    const note = rejectionReason === 'Other' ? customRejectionNote : rejectionReason;
    if (!note) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setIsUpdating(true);
    try {
      await updateDetectionStatus(selectedDetection.id, 'rejected', note);
      toast.success('Detection rejected. Farmer has been notified.');
      setShowRejectDialog(false);
      setRejectionReason('');
      setCustomRejectionNote('');
      // Move to next item
      const nextIndex = Math.min(currentIndex, pendingDetections.length - 2);
      if (nextIndex >= 0 && pendingDetections[nextIndex + 1]) {
        setSelectedDetection(pendingDetections[nextIndex + 1]);
      } else {
        setSelectedDetection(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedDetection || !requestInfoMessage.trim()) {
      toast.error('Please enter a message for the farmer');
      return;
    }
    // In a real app, this would send a notification/message to the farmer
    // For now, we'll just add a note to the detection
    setIsUpdating(true);
    try {
      // Here you could call an edge function to send a push notification
      toast.success('Request sent to farmer for more information.');
      setShowRequestInfoDialog(false);
      setRequestInfoMessage('');
    } finally {
      setIsUpdating(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Verification Queue
            {newReportCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {newReportCount} New
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Review and verify incoming pest detection reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {pendingDetections.length} Pending
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      {pendingDetections.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">
            No pending reports to verify. New reports will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel: Image & Details */}
          <div className="glass-card p-4 space-y-4">
            {selectedDetection && (
              <>
                {/* Image */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                  <img
                    src={selectedDetection.image_url || '/placeholder.svg'}
                    alt={selectedDetection.pest_type}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-primary">
                    <Leaf className="w-3 h-3 mr-1" />
                    {selectedDetection.crop_type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="absolute top-3 right-3 bg-background/80 backdrop-blur"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(selectedDetection.created_at), { addSuffix: true })}
                  </Badge>
                </div>

                {/* Farmer Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedDetection.farmer_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedDetection.farmer_email}</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedDetection.notes && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Farmer Notes:</strong> {selectedDetection.notes}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel: Detection & Map */}
          <div className="space-y-4">
            {selectedDetection && (
              <>
                {/* AI Detection Result */}
                <div className="glass-card p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bug className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">AI Detection</p>
                      <h3 className="font-bold text-xl">{selectedDetection.pest_type}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-primary border-primary">
                          <Percent className="w-3 h-3 mr-1" />
                          {(Number(selectedDetection.confidence) * 100).toFixed(0)}% Confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Map */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  {selectedDetection.latitude && selectedDetection.longitude ? (
                    <>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-3">
                        <iframe
                          title="Detection Location"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                            Number(selectedDetection.longitude) - 0.01
                          }%2C${Number(selectedDetection.latitude) - 0.01}%2C${
                            Number(selectedDetection.longitude) + 0.01
                          }%2C${Number(selectedDetection.latitude) + 0.01}&layer=mapnik&marker=${
                            selectedDetection.latitude
                          }%2C${selectedDetection.longitude}`}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Coordinates: {Number(selectedDetection.latitude).toFixed(6)},{' '}
                        {Number(selectedDetection.longitude).toFixed(6)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No GPS coordinates available</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="glass-card p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      className="h-14 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleVerify}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 border-red-500/50 text-red-500 hover:bg-red-500/10"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={isUpdating}
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14"
                      onClick={() => setShowRequestInfoDialog(true)}
                      disabled={isUpdating}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Request Info
                    </Button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={goToPrevious}
                    disabled={currentIndex <= 0}
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} of {pendingDetections.length}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={goToNext}
                    disabled={currentIndex >= pendingDetections.length - 1}
                  >
                    Next
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Reject Detection
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this pest detection report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {rejectionReason === 'Other' && (
              <Textarea
                placeholder="Enter custom rejection reason..."
                value={customRejectionNote}
                onChange={(e) => setCustomRejectionNote(e.target.value)}
                rows={3}
              />
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={isUpdating || !rejectionReason}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Request More Information
            </DialogTitle>
            <DialogDescription>
              Send a message to the farmer requesting additional details or a clearer photo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., Please provide a clearer photo of the pest. The current image is too blurry to make an accurate assessment."
              value={requestInfoMessage}
              onChange={(e) => setRequestInfoMessage(e.target.value)}
              rows={4}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRequestInfoDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleRequestInfo}
                disabled={isUpdating || !requestInfoMessage.trim()}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationQueue;
