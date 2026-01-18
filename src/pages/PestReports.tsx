import { useDetectionStore } from '@/store/detectionStore';
import { DetectionCard } from '@/components/dashboard/DetectionCard';
import { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PestReports = () => {
  const { detections } = useDetectionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cropFilter, setCropFilter] = useState<string>('all');

  const filteredDetections = detections.filter((d) => {
    const matchesSearch =
      d.pestType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesCrop = cropFilter === 'all' || d.cropType === cropFilter;
    return matchesSearch && matchesStatus && matchesCrop;
  });

  const uniqueCrops = [...new Set(detections.map((d) => d.cropType))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pest Reports</h1>
          <p className="text-muted-foreground">
            All pest detection submissions from farmers
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
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
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
              <SelectItem key={crop} value={crop}>
                {crop}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredDetections.length} of {detections.length} reports
      </p>

      {/* Reports Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDetections.map((detection) => (
          <DetectionCard key={detection.id} detection={detection} />
        ))}
      </div>
    </div>
  );
};

export default PestReports;
