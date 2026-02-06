import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Ruler, Loader2, User, Camera, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFarmerFarms, FarmerFarm } from '@/hooks/useFarmerFarms';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FARM_SIZES = [
  'Less than 1 hectare',
  '1-3 hectares',
  '3-5 hectares',
  '5-10 hectares',
  'More than 10 hectares'
];

interface FarmFormData {
  farm_name: string;
  landmark: string;
  address: string;
  latitude: string;
  longitude: string;
  size: string;
}

const emptyFarmData: FarmFormData = {
  farm_name: '',
  landmark: '',
  address: '',
  latitude: '',
  longitude: '',
  size: '',
};

const FarmerProfile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, user } = useAuthContext();
  const { farms, saveFarm, deleteFarm, isLoading: farmsLoading } = useFarmerFarms();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [expandedFarms, setExpandedFarms] = useState<number[]>([1]);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });

  // Initialize farm forms from existing data
  const [farmForms, setFarmForms] = useState<Record<number, FarmFormData>>(() => {
    const initial: Record<number, FarmFormData> = {};
    [1, 2, 3].forEach(num => {
      const existingFarm = farms.find(f => f.farm_number === num);
      if (existingFarm) {
        initial[num] = {
          farm_name: existingFarm.farm_name || '',
          landmark: existingFarm.landmark || '',
          address: existingFarm.address || '',
          latitude: existingFarm.latitude?.toString() || '',
          longitude: existingFarm.longitude?.toString() || '',
          size: existingFarm.size || '',
        };
      } else {
        initial[num] = { ...emptyFarmData };
      }
    });
    return initial;
  });

  // Update farm forms when farms data changes
  useState(() => {
    const updated: Record<number, FarmFormData> = {};
    [1, 2, 3].forEach(num => {
      const existingFarm = farms.find(f => f.farm_number === num);
      if (existingFarm) {
        updated[num] = {
          farm_name: existingFarm.farm_name || '',
          landmark: existingFarm.landmark || '',
          address: existingFarm.address || '',
          latitude: existingFarm.latitude?.toString() || '',
          longitude: existingFarm.longitude?.toString() || '',
          size: existingFarm.size || '',
        };
      } else {
        updated[num] = farmForms[num] || { ...emptyFarmData };
      }
    });
    setFarmForms(updated);
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('detection-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('detection-images')
        .getPublicUrl(filePath);

      // Update profile
      await updateProfile({ avatar_url: publicUrl });
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Update profile (name and phone only)
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      // Save all farms that have data
      for (const farmNum of [1, 2, 3]) {
        const farmData = farmForms[farmNum];
        const hasData = farmData.address || farmData.landmark || farmData.size;
        
        if (hasData) {
          await saveFarm({
            farm_number: farmNum,
            farm_name: farmData.farm_name || `Farm ${farmNum}`,
            landmark: farmData.landmark || null,
            address: farmData.address || null,
            latitude: farmData.latitude ? parseFloat(farmData.latitude) : null,
            longitude: farmData.longitude ? parseFloat(farmData.longitude) : null,
            size: farmData.size || null,
          });
        }
      }

      toast.success('Profile updated successfully!');
      navigate('/farmer');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFarmExpanded = (farmNum: number) => {
    setExpandedFarms(prev => 
      prev.includes(farmNum) 
        ? prev.filter(n => n !== farmNum)
        : [...prev, farmNum]
    );
  };

  const updateFarmForm = (farmNum: number, field: keyof FarmFormData, value: string) => {
    setFarmForms(prev => ({
      ...prev,
      [farmNum]: {
        ...prev[farmNum],
        [field]: value,
      },
    }));
  };

  const handleDeleteFarm = async (farmNum: number) => {
    try {
      await deleteFarm(farmNum);
      setFarmForms(prev => ({
        ...prev,
        [farmNum]: { ...emptyFarmData },
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const getLocationFromGPS = async (farmNum: number) => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      updateFarmForm(farmNum, 'latitude', position.coords.latitude.toString());
      updateFarmForm(farmNum, 'longitude', position.coords.longitude.toString());
      toast.success('GPS coordinates captured!');
    } catch (error) {
      toast.error('Could not get GPS location');
    }
  };

  const hasFarmData = (farmNum: number) => {
    const farm = farms.find(f => f.farm_number === farmNum);
    return !!farm;
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
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-primary" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
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

        {/* Farm Details - Multiple Farms */}
        <div className="space-y-3">
          <h2 className="font-medium text-foreground">Farm Details</h2>
          <p className="text-sm text-muted-foreground">
            Add up to 3 farm locations. These will be available when uploading pest detections.
          </p>

          {[1, 2, 3].map((farmNum) => (
            <Collapsible
              key={farmNum}
              open={expandedFarms.includes(farmNum)}
              onOpenChange={() => toggleFarmExpanded(farmNum)}
            >
              <div className="glass-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        hasFarmData(farmNum) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {farmNum}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">
                          {farmForms[farmNum]?.farm_name || `Farm ${farmNum}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hasFarmData(farmNum) ? 'Configured' : 'Not configured'}
                        </p>
                      </div>
                    </div>
                    {expandedFarms.includes(farmNum) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                    <div className="space-y-2">
                      <Label>Farm Name (Optional)</Label>
                      <Input
                        value={farmForms[farmNum]?.farm_name || ''}
                        onChange={(e) => updateFarmForm(farmNum, 'farm_name', e.target.value)}
                        placeholder={`Farm ${farmNum}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Landmark
                      </Label>
                      <Input
                        value={farmForms[farmNum]?.landmark || ''}
                        onChange={(e) => updateFarmForm(farmNum, 'landmark', e.target.value)}
                        placeholder="Near the main road, beside the river..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input
                        value={farmForms[farmNum]?.address || ''}
                        onChange={(e) => updateFarmForm(farmNum, 'address', e.target.value)}
                        placeholder="Barangay, Municipality, Province"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>GPS Coordinates</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={farmForms[farmNum]?.latitude || ''}
                          onChange={(e) => updateFarmForm(farmNum, 'latitude', e.target.value)}
                          placeholder="Latitude"
                          type="number"
                          step="any"
                        />
                        <Input
                          value={farmForms[farmNum]?.longitude || ''}
                          onChange={(e) => updateFarmForm(farmNum, 'longitude', e.target.value)}
                          placeholder="Longitude"
                          type="number"
                          step="any"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => getLocationFromGPS(farmNum)}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Get Current Location
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Ruler className="w-4 h-4" /> Farm Size
                      </Label>
                      <Select
                        value={farmForms[farmNum]?.size || ''}
                        onValueChange={(value) => updateFarmForm(farmNum, 'size', value)}
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

                    {hasFarmData(farmNum) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                        onClick={() => handleDeleteFarm(farmNum)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Farm {farmNum}
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
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
