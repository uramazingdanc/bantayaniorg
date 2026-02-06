import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

export interface FarmerFarm {
  id: string;
  user_id: string;
  farm_number: number;
  farm_name: string | null;
  landmark: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  size: string | null;
  created_at: string;
  updated_at: string;
}

export function useFarmerFarms() {
  const { user } = useAuthContext();
  const [farms, setFarms] = useState<FarmerFarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFarms = useCallback(async () => {
    if (!user) {
      setFarms([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('farmer_farms')
        .select('*')
        .eq('user_id', user.id)
        .order('farm_number', { ascending: true });

      if (error) throw error;
      setFarms(data as FarmerFarm[] || []);
    } catch (err) {
      console.error('Error fetching farms:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFarms();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('farmer_farms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farmer_farms',
        },
        () => {
          fetchFarms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFarms]);

  const saveFarm = async (farmData: Omit<FarmerFarm, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Not authenticated');

    const existingFarm = farms.find(f => f.farm_number === farmData.farm_number);

    try {
      if (existingFarm) {
        // Update existing farm
        const { data, error } = await supabase
          .from('farmer_farms')
          .update({
            farm_name: farmData.farm_name,
            landmark: farmData.landmark,
            address: farmData.address,
            latitude: farmData.latitude,
            longitude: farmData.longitude,
            size: farmData.size,
          })
          .eq('id', existingFarm.id)
          .select()
          .single();

        if (error) throw error;
        toast.success(`Farm ${farmData.farm_number} updated successfully`);
        await fetchFarms();
        return data;
      } else {
        // Insert new farm
        const { data, error } = await supabase
          .from('farmer_farms')
          .insert({
            user_id: user.id,
            farm_number: farmData.farm_number,
            farm_name: farmData.farm_name,
            landmark: farmData.landmark,
            address: farmData.address,
            latitude: farmData.latitude,
            longitude: farmData.longitude,
            size: farmData.size,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success(`Farm ${farmData.farm_number} added successfully`);
        await fetchFarms();
        return data;
      }
    } catch (err) {
      console.error('Error saving farm:', err);
      toast.error('Failed to save farm');
      throw err;
    }
  };

  const deleteFarm = async (farmNumber: number) => {
    const farm = farms.find(f => f.farm_number === farmNumber);
    if (!farm) return;

    try {
      const { error } = await supabase
        .from('farmer_farms')
        .delete()
        .eq('id', farm.id);

      if (error) throw error;
      toast.success(`Farm ${farmNumber} removed`);
      await fetchFarms();
    } catch (err) {
      console.error('Error deleting farm:', err);
      toast.error('Failed to delete farm');
      throw err;
    }
  };

  const getFarmByNumber = (farmNumber: number) => {
    return farms.find(f => f.farm_number === farmNumber);
  };

  return {
    farms,
    isLoading,
    error,
    saveFarm,
    deleteFarm,
    getFarmByNumber,
    refetch: fetchFarms,
  };
}
