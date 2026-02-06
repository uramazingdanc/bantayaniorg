import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Farmer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  farm_location?: string;
  farm_size?: string;
  main_crop?: string;
  phone?: string;
  created_at: string;
  total_reports: number;
  verified_reports: number;
  pending_reports: number;
}

export function useFarmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFarmers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First, get all user_ids with farmer role
      const { data: farmerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'farmer');

      if (rolesError) throw rolesError;

      if (!farmerRoles || farmerRoles.length === 0) {
        setFarmers([]);
        return;
      }

      const farmerUserIds = farmerRoles.map(r => r.user_id);

      // Get profiles for these farmers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', farmerUserIds);

      if (profilesError) throw profilesError;

      // Get detection stats for each farmer
      const farmersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: detections, error: detectionsError } = await supabase
            .from('pest_detections')
            .select('status')
            .eq('user_id', profile.user_id);

          if (detectionsError) {
            console.error('Error fetching detections for farmer:', detectionsError);
          }

          const total_reports = detections?.length || 0;
          const verified_reports = detections?.filter(d => d.status === 'verified').length || 0;
          const pending_reports = detections?.filter(d => d.status === 'pending').length || 0;

          return {
            ...profile,
            total_reports,
            verified_reports,
            pending_reports,
          } as Farmer;
        })
      );

      setFarmers(farmersWithStats);
    } catch (err) {
      console.error('Error fetching farmers:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarmers();

    // Subscribe to realtime updates for profiles
    const profilesChannel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          console.log('Profiles updated, refreshing farmers...');
          fetchFarmers();
        }
      )
      .subscribe();

    // Subscribe to realtime updates for detections (to update stats)
    const detectionsChannel = supabase
      .channel('farmer_detections_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pest_detections',
        },
        () => {
          console.log('Detections updated, refreshing farmer stats...');
          fetchFarmers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(detectionsChannel);
    };
  }, [fetchFarmers]);

  const getStats = () => {
    const total = farmers.length;
    const totalReports = farmers.reduce((sum, f) => sum + f.total_reports, 0);
    const verifiedReports = farmers.reduce((sum, f) => sum + f.verified_reports, 0);
    return { total, totalReports, verifiedReports };
  };

  return {
    farmers,
    isLoading,
    error,
    refetch: fetchFarmers,
    getStats,
  };
}
