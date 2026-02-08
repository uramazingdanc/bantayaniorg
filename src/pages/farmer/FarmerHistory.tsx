import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, XCircle, MapPin, Calendar, Bug, Loader2, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useDetections, DetectionWithProfile } from '@/hooks/useDetections';
import { useMessages } from '@/hooks/useMessages';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

const FarmerHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { detections, isLoading } = useDetections(false);
  const { messages, sendMessage } = useMessages();
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [selectedDetection, setSelectedDetection] = useState<DetectionWithProfile | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const filteredDetections = detections.filter(d => 
    filter === 'all' ? true : d.status === filter
  );

  // Get messages for a specific detection
  const getDetectionMessages = (detectionId: string) => {
    return messages.filter(m => m.detection_id === detectionId);
  };

  // Get unread messages count for a detection
  const getUnreadCount = (detectionId: string) => {
    if (!user) return 0;
    return messages.filter(
      m => m.detection_id === detectionId && 
           m.recipient_id === user.id && 
           !m.is_read
    ).length;
  };

  const handleSendReply = async () => {
    if (!selectedDetection || !replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setIsSending(true);
    try {
      // Send to LGU admin (we'll use verified_by or a default admin)
      const recipientId = selectedDetection.verified_by || 'admin';
      await sendMessage(recipientId, replyMessage, selectedDetection.id);
      setReplyMessage('');
      setShowMessageDialog(false);
      toast.success('Message sent to LGU');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-accent-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      verified: 'bg-primary/20 text-primary border-primary/30',
      rejected: 'bg-destructive/20 text-destructive border-destructive/30',
      pending: 'bg-accent/20 text-accent-foreground border-accent/30',
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
            {filteredDetections.map((detection) => {
              const unreadCount = getUnreadCount(detection.id);
              const detectionMessages = getDetectionMessages(detection.id);
              
              return (
                <button
                  key={detection.id}
                  onClick={() => setSelectedDetection(detection)}
                  className="w-full text-left glass-card p-4 flex gap-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Image Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                    <img 
                      src={detection.image_url || '/placeholder.svg'} 
                      alt={detection.pest_type}
                      className="w-full h-full object-cover"
                    />
                    {unreadCount > 0 && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {unreadCount}
                      </div>
                    )}
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

                    {/* Timestamps */}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Reported: {format(new Date(detection.created_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      {detection.verified_at && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          <span>
                            {detection.status === 'verified' ? 'Verified' : 'Reviewed'}: {format(new Date(detection.verified_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      )}
                      {(detection as any).lgu_response_at && (
                        <div className="flex items-center gap-1">
                          <Send className="w-3 h-3 text-primary" />
                          <span>
                            LGU Response: {format(new Date((detection as any).lgu_response_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>

                    {(detection.notes || detectionMessages.length > 0) && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                        <MessageSquare className="w-3 h-3" />
                        <span>
                          {detectionMessages.length > 0 
                            ? `${detectionMessages.length} message(s)` 
                            : 'LGU Response'}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detection Detail Dialog */}
      <Dialog open={!!selectedDetection} onOpenChange={() => setSelectedDetection(null)}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          {selectedDetection && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-primary" />
                  {selectedDetection.pest_type}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  {/* Image */}
                  <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                    <img 
                      src={selectedDetection.image_url || '/placeholder.svg'} 
                      alt={selectedDetection.pest_type}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusBadge(selectedDetection.status)}>
                      {getStatusIcon(selectedDetection.status)}
                      <span className="ml-1 capitalize">{selectedDetection.status}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(selectedDetection.confidence * 100)}% confidence
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="glass-card p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Crop Type</p>
                      <p className="text-sm text-foreground">{selectedDetection.crop_type}</p>
                    </div>

                    {selectedDetection.location_name && (
                      <div className="glass-card p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Location</p>
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedDetection.location_name}
                        </p>
                        {selectedDetection.latitude && selectedDetection.longitude && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Coordinates: {Number(selectedDetection.latitude).toFixed(6)}, {Number(selectedDetection.longitude).toFixed(6)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Timestamps Section */}
                    <div className="glass-card p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Timeline</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Detection Submitted</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(selectedDetection.created_at), 'MMMM d, yyyy • h:mm a')}
                            </p>
                          </div>
                        </div>

                        {selectedDetection.verified_at && (
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${
                              selectedDetection.status === 'verified' ? 'bg-primary' : 'bg-destructive'
                            }`} />
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                {selectedDetection.status === 'verified' ? 'Verified by LGU' : 'Reviewed by LGU'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(selectedDetection.verified_at), 'MMMM d, yyyy • h:mm a')}
                              </p>
                            </div>
                          </div>
                        )}

                        {(selectedDetection as any).lgu_response_at && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                            <div>
                              <p className="text-xs font-medium text-foreground">LGU Response/Intervention</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date((selectedDetection as any).lgu_response_at), 'MMMM d, yyyy • h:mm a')}
                              </p>
                              {(selectedDetection as any).intervention_type && (
                                <p className="text-xs text-primary mt-1">
                                  Type: {(selectedDetection as any).intervention_type}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LGU Notes/Response */}
                    {selectedDetection.notes && (
                      <div className="glass-card p-3 border-l-4 border-primary">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">LGU Response</p>
                        <p className="text-sm text-foreground">{selectedDetection.notes}</p>
                      </div>
                    )}

                    {/* Messages Section */}
                    {getDetectionMessages(selectedDetection.id).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Messages</p>
                        {getDetectionMessages(selectedDetection.id).map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`glass-card p-3 ${
                              msg.sender_id === user?.id 
                                ? 'border-l-4 border-primary/50 ml-4' 
                                : 'border-l-4 border-accent mr-4'
                            }`}
                          >
                            <p className="text-xs text-muted-foreground mb-1">
                              {msg.sender_id === user?.id ? 'You' : 'LGU Admin'} • {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                            </p>
                            <p className="text-sm text-foreground">{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Farmer Notes */}
                    {(selectedDetection as any).farmer_notes && (
                      <div className="glass-card p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Your Notes</p>
                        <p className="text-sm text-muted-foreground italic">
                          "{(selectedDetection as any).farmer_notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowMessageDialog(true);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Reply
                </Button>
                <Button variant="outline" onClick={() => setSelectedDetection(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Reply Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Send Message to LGU
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message or question for the LGU..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowMessageDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendReply}
                disabled={isSending || !replyMessage.trim()}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmerHistory;
