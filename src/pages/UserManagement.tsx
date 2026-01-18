import { useState } from 'react';
import { Search, Mail, MapPin, Sprout, MoreVertical, UserCheck, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Farmer {
  id: string;
  name: string;
  email: string;
  location: string;
  mainCrop: string;
  totalReports: number;
  verifiedReports: number;
  isActive: boolean;
  joinedAt: string;
}

const mockFarmers: Farmer[] = [
  {
    id: '1',
    name: 'Juan dela Cruz',
    email: 'juan@email.com',
    location: 'Davao del Sur',
    mainCrop: 'Rice',
    totalReports: 24,
    verifiedReports: 18,
    isActive: true,
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    location: 'Davao del Norte',
    mainCrop: 'Corn',
    totalReports: 15,
    verifiedReports: 12,
    isActive: true,
    joinedAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Pedro Garcia',
    email: 'pedro@email.com',
    location: 'Davao Oriental',
    mainCrop: 'Vegetables',
    totalReports: 8,
    verifiedReports: 5,
    isActive: false,
    joinedAt: '2024-03-10',
  },
  {
    id: '4',
    name: 'Ana Reyes',
    email: 'ana@email.com',
    location: 'Compostela Valley',
    mainCrop: 'Banana',
    totalReports: 31,
    verifiedReports: 28,
    isActive: true,
    joinedAt: '2023-11-05',
  },
];

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [farmers, setFarmers] = useState(mockFarmers);

  const filteredFarmers = farmers.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFarmerStatus = (id: string) => {
    setFarmers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isActive: !f.isActive } : f))
    );
  };

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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <UserCheck className="w-4 h-4 text-primary" />
            {farmers.filter((f) => f.isActive).length} Active
          </span>
          <span className="flex items-center gap-1">
            <UserX className="w-4 h-4 text-destructive" />
            {farmers.filter((f) => !f.isActive).length} Inactive
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
                Status
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
                    {farmer.location}
                  </span>
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-1 text-sm text-foreground">
                    <Sprout className="w-4 h-4 text-primary" />
                    {farmer.mainCrop}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <span className="text-foreground font-medium">
                      {farmer.verifiedReports}
                    </span>
                    <span className="text-muted-foreground">
                      /{farmer.totalReports} verified
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      farmer.isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {farmer.isActive ? 'Active' : 'Inactive'}
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
                      <DropdownMenuItem
                        onClick={() => toggleFarmerStatus(farmer.id)}
                      >
                        {farmer.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
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
    </div>
  );
};

export default UserManagement;
