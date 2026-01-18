import { useState } from 'react';
import { useAdvisoryStore, AdvisoryPriority } from '@/store/advisoryStore';
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
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

const priorityConfig: Record<AdvisoryPriority, { icon: typeof AlertCircle; color: string; bg: string }> = {
  low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  medium: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  high: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  critical: { icon: Zap, color: 'text-red-400', bg: 'bg-red-500/20' },
};

const Advisories = () => {
  const { advisories, addAdvisory, toggleActive, deleteAdvisory } = useAdvisoryStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newAdvisory, setNewAdvisory] = useState({
    title: '',
    content: '',
    pestType: '',
    affectedCrops: '',
    affectedRegions: '',
    priority: 'medium' as AdvisoryPriority,
    createdBy: 'Admin',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAdvisory({
      ...newAdvisory,
      affectedCrops: newAdvisory.affectedCrops.split(',').map((c) => c.trim()),
      affectedRegions: newAdvisory.affectedRegions.split(',').map((r) => r.trim()),
    });
    setNewAdvisory({
      title: '',
      content: '',
      pestType: '',
      affectedCrops: '',
      affectedRegions: '',
      priority: 'medium',
      createdBy: 'Admin',
    });
    setIsOpen(false);
  };

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
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                New Advisory
              </DialogTitle>
            </DialogHeader>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pest Type</Label>
                  <Input
                    value={newAdvisory.pestType}
                    onChange={(e) =>
                      setNewAdvisory({ ...newAdvisory, pestType: e.target.value })
                    }
                    placeholder="e.g., Fall Armyworm"
                    className="input-dark"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newAdvisory.priority}
                    onValueChange={(v) =>
                      setNewAdvisory({ ...newAdvisory, priority: v as AdvisoryPriority })
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
              </div>

              <div className="space-y-2">
                <Label>Affected Crops (comma separated)</Label>
                <Input
                  value={newAdvisory.affectedCrops}
                  onChange={(e) =>
                    setNewAdvisory({ ...newAdvisory, affectedCrops: e.target.value })
                  }
                  placeholder="Rice, Corn, Vegetables"
                  className="input-dark"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Affected Regions (comma separated)</Label>
                <Input
                  value={newAdvisory.affectedRegions}
                  onChange={(e) =>
                    setNewAdvisory({ ...newAdvisory, affectedRegions: e.target.value })
                  }
                  placeholder="Davao del Sur, Davao del Norte"
                  className="input-dark"
                  required
                />
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
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary-glow">
                  Publish Advisory
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Advisory List */}
      <div className="space-y-4">
        {advisories.map((advisory) => {
          const PriorityIcon = priorityConfig[advisory.priority].icon;
          return (
            <div
              key={advisory.id}
              className={`glass-card p-5 transition-all ${
                !advisory.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Priority Icon */}
                <div
                  className={`p-2.5 rounded-xl ${priorityConfig[advisory.priority].bg}`}
                >
                  <PriorityIcon
                    className={`w-5 h-5 ${priorityConfig[advisory.priority].color}`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {advisory.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {advisory.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => toggleActive(advisory.id)}
                      >
                        {advisory.isActive ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteAdvisory(advisory.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                      {advisory.pestType}
                    </span>
                    {advisory.affectedCrops.map((crop) => (
                      <span
                        key={crop}
                        className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(advisory.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span>By {advisory.createdBy}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        advisory.isActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {advisory.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Advisories;
