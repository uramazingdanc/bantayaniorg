import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Ruler, Wheat, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CROP_OPTIONS = [
  'Rice', 'Corn', 'Coconut', 'Sugarcane', 'Banana', 
  'Mango', 'Vegetables', 'Coffee', 'Cacao', 'Other'
];

const FARM_SIZES = [
  'Less than 1 hectare',
  '1-3 hectares',
  '3-5 hectares',
  '5-10 hectares',
  'More than 10 hectares'
];

const FarmerProfile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuthContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    farm_location: profile?.farm_location || '',
    farm_size: profile?.farm_size || '',
    main_crop: profile?.main_crop || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      navigate('/farmer');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 p-4">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/farmer')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Profile Settings</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 max-w-md mx-auto space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-12 h-12 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        {/* Personal Info */}
        <div className="glass-card p-4 space-y-4">
          <h2 className="font-medium text-foreground">Personal Information</h2>
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Juan Dela Cruz"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+63 912 345 6789"
            />
          </div>
        </div>

        {/* Farm Details */}
        <div className="glass-card p-4 space-y-4">
          <h2 className="font-medium text-foreground">Farm Details</h2>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Farm Location
            </Label>
            <Input
              id="location"
              value={formData.farm_location}
              onChange={(e) => setFormData({ ...formData, farm_location: e.target.value })}
              placeholder="Barangay, Municipality, Province"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Farm Size
            </Label>
            <Select
              value={formData.farm_size}
              onValueChange={(value) => setFormData({ ...formData, farm_size: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select farm size" />
              </SelectTrigger>
              <SelectContent>
                {FARM_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wheat className="w-4 h-4" /> Main Crop
            </Label>
            <Select
              value={formData.main_crop}
              onValueChange={(value) => setFormData({ ...formData, main_crop: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select main crop" />
              </SelectTrigger>
              <SelectContent>
                {CROP_OPTIONS.map((crop) => (
                  <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full btn-primary-glow" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </form>
    </div>
  );
};

export default FarmerProfile;
