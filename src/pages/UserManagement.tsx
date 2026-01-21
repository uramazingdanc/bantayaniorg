import { useState } from 'react';
import { Search, Mail, MapPin, Sprout, MoreVertical, UserCheck, Users, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFarmers } from '@/hooks/useFarmers';
import { format } from 'date-fns';

const UserManagement = () => {
  const { farmers, isLoading, getStats } = useFarmers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.farm_location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = getStats();

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
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Farmer
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Location
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Main Crop
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Reports
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.map((farmer) => (
                <tr
                  key={farmer.id}
                  className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{farmer.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {farmer.email}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {farmer.farm_location || 'Not set'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-sm text-foreground">
                      <Sprout className="w-4 h-4 text-primary" />
                      {farmer.main_crop || 'Not set'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="text-foreground font-medium">
                        {farmer.verified_reports}
                      </span>
                      <span className="text-muted-foreground">
                        /{farmer.total_reports} verified
                      </span>
                    </div>
                    {farmer.pending_reports > 0 && (
                      <span className="text-xs text-accent-foreground">
                        ({farmer.pending_reports} pending)
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(farmer.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-card">
                        <DropdownMenuItem>View Reports</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
