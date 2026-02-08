import { useState } from 'react';
import { useAdvisories } from '@/hooks/useAdvisories';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Plus,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

const severityConfig: Record<SeverityLevel, { icon: typeof AlertCircle; color: string; bg: string }> = {
  low: { icon: Info, color: 'text-primary', bg: 'bg-primary/20' },
  medium: { icon: AlertCircle, color: 'text-accent-foreground', bg: 'bg-accent/20' },
  high: { icon: AlertTriangle, color: 'text-primary', bg: 'bg-primary/20' },
  critical: { icon: Zap, color: 'text-destructive', bg: 'bg-destructive/20' },
};

// Barangay list for Bongabon
const BARANGAYS = [
  'Antipolo', 'Ariendo', 'Bantug', 'Calaanan', 'Commercial', 'Cruz',
  'Digmala', 'Curva', 'Kaingin', 'Labi', 'Larcon', 'Lusok',
  'Macabaclay', 'Magtanggol', 'Mantile', 'Olivete', 'Palo Maria',
  'Pesa', 'Rizal', 'Sampalucan', 'San Roque', 'Santor', 'Sinipit',
  'Sisilang na Ligaya', 'Social', 'Tugatug', 'Tulay na Bato', 'Vega Grande'
];

type AdvisoryCategory = 'general_advisory' | 'specific_response';

const Advisories = () => {
  const { advisories, isLoading, createAdvisory, toggleActive, deleteAdvisory } = useAdvisories();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAdvisory, setSelectedAdvisory] = useState<typeof advisories[0] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | AdvisoryCategory>('all');
  const [newAdvisory, setNewAdvisory] = useState({
    title: '',
    content: '',
    affectedCrops: '',
    affectedBarangays: [] as string[],
    severity: 'medium' as SeverityLevel,
    category: 'general_advisory' as AdvisoryCategory,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createAdvisory({
        title: newAdvisory.title,
        content: newAdvisory.content,
        severity: newAdvisory.severity,
        affected_crops: newAdvisory.affectedCrops.split(',').map((c) => c.trim()).filter(Boolean),
        affected_regions: newAdvisory.affectedBarangays,
        category: newAdvisory.category,
      });
      
      setNewAdvisory({
        title: '',
        content: '',
        affectedCrops: '',
        affectedBarangays: [],
        severity: 'medium',
        category: 'general_advisory',
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating advisory:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter advisories by category
  const filteredAdvisories = advisories.filter(a => 
    categoryFilter === 'all' ? true : (a as any).category === categoryFilter
  );

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await toggleActive(id, isActive);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this advisory?')) {
      await deleteAdvisory(id);
    }
  };

  const toggleBarangay = (barangay: string) => {
    setNewAdvisory(prev => ({
      ...prev,
      affectedBarangays: prev.affectedBarangays.includes(barangay)
        ? prev.affectedBarangays.filter(b => b !== barangay)
        : [...prev.affectedBarangays, barangay]
    }));
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
          <h1 className="text-2xl font-bold text-foreground">Advisories</h1>
          <p className="text-muted-foreground">
            Manage pest alerts and warnings for farmers
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 btn-primary-glow">
              <Plus className="w-4 h-4" />
              Create Advisory
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-lg max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                New Advisory
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newAdvisory.title}
                    onChange={(e) =>
                      setNewAdvisory({ ...newAdvisory, title: e.target.value })
                    }
                    placeholder="Advisory title..."
                    className="input-dark"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newAdvisory.category}
                    onValueChange={(v) =>
                      setNewAdvisory({ ...newAdvisory, category: v as AdvisoryCategory })
                    }
                  >
                    <SelectTrigger className="input-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="general_advisory">General Advisory</SelectItem>
                      <SelectItem value="specific_response">Specific Farmer Response</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={newAdvisory.severity}
                    onValueChange={(v) =>
                      setNewAdvisory({ ...newAdvisory, severity: v as SeverityLevel })
                    }
                  >
                    <SelectTrigger className="input-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Affected Crops (comma separated)</Label>
                  <Input
                    value={newAdvisory.affectedCrops}
                    onChange={(e) =>
                      setNewAdvisory({ ...newAdvisory, affectedCrops: e.target.value })
                    }
                    placeholder="Rice, Corn, Vegetables, Onion"
                    className="input-dark"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Affected Barangays</Label>
                  <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {BARANGAYS.map((barangay) => (
                        <label
                          key={barangay}
                          className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
                        >
                          <Checkbox
                            checked={newAdvisory.affectedBarangays.includes(barangay)}
                            onCheckedChange={() => toggleBarangay(barangay)}
                          />
                          {barangay}
                        </label>
                      ))}
                    </div>
                  </div>
                  {newAdvisory.affectedBarangays.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {newAdvisory.affectedBarangays.join(', ')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Advisory Content</Label>
                  <Textarea
                    value={newAdvisory.content}
                    onChange={(e) =>
                      setNewAdvisory({ ...newAdvisory, content: e.target.value })
                    }
                    placeholder="Detailed advisory message for farmers..."
                    className="input-dark min-h-[120px]"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 btn-primary-glow" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      'Publish Advisory'
                    )}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'general_advisory', 'specific_response'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'general_advisory' ? 'General Advisory' : 'Specific Response'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{filteredAdvisories.length}</p>
          <p className="text-xs text-muted-foreground">Showing</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{filteredAdvisories.filter(a => a.is_active).length}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-destructive">
            {filteredAdvisories.filter(a => a.severity === 'critical' || a.severity === 'high').length}
          </p>
          <p className="text-xs text-muted-foreground">High Priority</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">
            {filteredAdvisories.filter(a => !a.is_active).length}
          </p>
          <p className="text-xs text-muted-foreground">Inactive</p>
        </div>
      </div>

      {/* Advisory List */}
      {filteredAdvisories.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium text-foreground mb-1">No advisories in this category</h3>
          <p className="text-sm text-muted-foreground">
            Create an advisory to alert farmers about pest threats
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAdvisories.map((advisory) => {
            const severity = (advisory.severity as SeverityLevel) || 'medium';
            const config = severityConfig[severity] || severityConfig.medium;
            const SeverityIcon = config.icon;
            
            return (
              <div
                key={advisory.id}
                className={`glass-card p-5 transition-all cursor-pointer hover:bg-muted/30 ${
                  !advisory.is_active ? 'opacity-60' : ''
                }`}
                onClick={() => setSelectedAdvisory(advisory)}
              >
                <div className="flex items-start gap-4">
                  {/* Severity Icon */}
                  <div className={`p-2.5 rounded-xl ${config.bg}`}>
                    <SeverityIcon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {advisory.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {advisory.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handleToggleActive(advisory.id, advisory.is_active)}
                        >
                          {advisory.is_active ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(advisory.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${config.bg} ${config.color}`}>
                        {severity}
                      </span>
                      {advisory.affected_crops?.slice(0, 3).map((crop) => (
                        <span
                          key={crop}
                          className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full"
                        >
                          {crop}
                        </span>
                      ))}
                      {(advisory.affected_crops?.length || 0) > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                          +{advisory.affected_crops.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(advisory.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>By {advisory.creator_name || 'Admin'}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          advisory.is_active
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {advisory.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory Detail Popup */}
      <Dialog open={!!selectedAdvisory} onOpenChange={() => setSelectedAdvisory(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          {selectedAdvisory && (() => {
            const severity = (selectedAdvisory.severity as SeverityLevel) || 'medium';
            const config = severityConfig[severity] || severityConfig.medium;
            const SeverityIcon = config.icon;
            
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <SeverityIcon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-left">{selectedAdvisory.title}</DialogTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={`${config.bg} ${config.color}`}>
                          {selectedAdvisory.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(selectedAdvisory.created_at), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {selectedAdvisory.creator_name || 'Admin'}
                        </span>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                
                <ScrollArea className="max-h-[50vh]">
                  <div className="space-y-4 pr-4">
                    {/* Full Content */}
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedAdvisory.content}
                    </div>

                    {/* Affected Crops */}
                    {selectedAdvisory.affected_crops?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Affected Crops:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedAdvisory.affected_crops.map((crop: string) => (
                            <Badge key={crop} variant="outline" className="text-xs">
                              {crop}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Affected Barangays */}
                    {selectedAdvisory.affected_regions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Affected Barangays:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedAdvisory.affected_regions.map((region: string) => (
                            <Badge key={region} variant="secondary" className="text-xs">
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleToggleActive(selectedAdvisory.id, selectedAdvisory.is_active);
                      setSelectedAdvisory(null);
                    }}
                  >
                    {selectedAdvisory.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedAdvisory(null)}>
                    Close
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Advisories;
