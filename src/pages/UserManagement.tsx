import { useState, useEffect } from 'react';
import { Search, Mail, MapPin, MoreVertical, UserCheck, Users, Loader2, Phone, Ruler, MessageSquare, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFarmers, Farmer } from '@/hooks/useFarmers';
import { useMessages } from '@/hooks/useMessages';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FarmerFarm {
  id: string;
  farm_number: number;
  farm_name: string | null;
  landmark: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  size: string | null;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { farmers, isLoading, getStats } = useFarmers();
  const { sendMessage } = useMessages();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerFarms, setFarmerFarms] = useState<FarmerFarm[]>([]);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.farm_location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = getStats();

  // Fetch farmer's farms when selected
  useEffect(() => {
    if (selectedFarmer) {
      setLoadingFarms(true);
      supabase
        .from('farmer_farms')
        .select('*')
        .eq('user_id', selectedFarmer.user_id)
        .order('farm_number', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setFarmerFarms(data as FarmerFarm[]);
          }
          setLoadingFarms(false);
        });
    } else {
      setFarmerFarms([]);
    }
  }, [selectedFarmer]);

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
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Manage registered farmers in your region
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4 text-primary" />
            {stats.total} Farmers
          </span>
          <span className="flex items-center gap-1">
            <UserCheck className="w-4 h-4 text-primary" />
            {stats.verifiedReports} Verified Reports
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search farmers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 input-dark"
        />
      </div>

      {/* Table */}
      {filteredFarmers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium text-foreground mb-1">No farmers found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? 'Try adjusting your search' : 'Farmers will appear here once they register'}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Farmer
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Location
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                  Phone
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Reports
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                  Joined
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((farmer) => (
                <tr
                  key={farmer.id}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => setSelectedFarmer(farmer)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(farmer as any).avatar_url || ''} alt={farmer.name} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {farmer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{farmer.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{farmer.email}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{farmer.farm_location || 'Not set'}</span>
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {farmer.phone || 'Not set'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="text-foreground font-medium">
                        {farmer.verified_reports}
                      </span>
                      <span className="text-muted-foreground">
                        /{farmer.total_reports}
                      </span>
                    </div>
                    {farmer.pending_reports > 0 && (
                      <span className="text-xs text-yellow-500">
                        ({farmer.pending_reports} pending)
                      </span>
                    )}
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(farmer.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card">
                        <DropdownMenuItem onClick={() => setSelectedFarmer(farmer)}>
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/pest-reports?farmer=${farmer.user_id}`)}>
                          View Reports
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Farmer Detail Dialog */}
      <Dialog open={!!selectedFarmer} onOpenChange={() => setSelectedFarmer(null)}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          {selectedFarmer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={(selectedFarmer as any).avatar_url || ''} alt={selectedFarmer.name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {selectedFarmer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <DialogTitle>
                    {selectedFarmer.name}
                  </DialogTitle>
                </div>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  {/* Contact Info */}
                  <div className="glass-card p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Contact Information</p>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {selectedFarmer.email}
                      </p>
                      <p className="text-sm text-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {selectedFarmer.phone || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  {/* Report Stats */}
                  <div className="glass-card p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Report Statistics</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">{selectedFarmer.total_reports}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-400">{selectedFarmer.verified_reports}</p>
                        <p className="text-xs text-muted-foreground">Verified</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-400">{selectedFarmer.pending_reports}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </div>

                  {/* Farm Locations */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Farm Locations</p>
                    {loadingFarms ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : farmerFarms.length === 0 ? (
                      <div className="glass-card p-3 text-center text-sm text-muted-foreground">
                        No farm locations registered
                      </div>
                    ) : (
                      farmerFarms.map((farm) => (
                        <div key={farm.id} className="glass-card p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                              {farm.farm_number}
                            </div>
                            <p className="font-medium text-sm text-foreground">
                              {farm.farm_name || `Farm ${farm.farm_number}`}
                            </p>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground pl-8">
                            {farm.address && (
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {farm.address}
                              </p>
                            )}
                            {farm.landmark && (
                              <p>Landmark: {farm.landmark}</p>
                            )}
                            {farm.size && (
                              <p className="flex items-center gap-1">
                                <Ruler className="w-3 h-3" />
                                {farm.size}
                              </p>
                            )}
                            {farm.latitude && farm.longitude && (
                              <p>GPS: {farm.latitude.toFixed(6)}, {farm.longitude.toFixed(6)}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Member Since */}
                  <div className="glass-card p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Member Since</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(selectedFarmer.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigate(`/admin/pest-reports?farmer=${selectedFarmer.user_id}`);
                    setSelectedFarmer(null);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowMessageDialog(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => setSelectedFarmer(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Send Message to {selectedFarmer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
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
                onClick={async () => {
                  if (!selectedFarmer || !messageContent.trim()) return;
                  setIsSending(true);
                  try {
                    await sendMessage(selectedFarmer.user_id, messageContent);
                    toast.success('Message sent');
                    setMessageContent('');
                    setShowMessageDialog(false);
                  } catch (error) {
                    toast.error('Failed to send message');
                  } finally {
                    setIsSending(false);
                  }
                }}
                disabled={isSending || !messageContent.trim()}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
