import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Detection = Database['public']['Tables']['pest_detections']['Row'];
type DetectionStatus = Database['public']['Enums']['detection_status'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface DetectionWithProfile extends Detection {
  farmer_name?: string;
  farmer_email?: string;
}

export function useDetections(isAdmin = false) {
  const [detections, setDetections] = useState<DetectionWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetections = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch detections
      const { data: detectionsData, error: detectionsError } = await supabase
        .from('pest_detections')
        .select('*')
        .order('created_at', { ascending: false });

      if (detectionsError) throw detectionsError;

      // Fetch profiles for the detection user_ids
      const userIds = [...new Set((detectionsData || []).map(d => d.user_id))];
      
      let profilesMap: Record<string, Profile> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, Profile>);
        }
      }

      // Merge detections with profile data
      const detectionsWithProfiles: DetectionWithProfile[] = (detectionsData || []).map(d => ({
        ...d,
        farmer_name: profilesMap[d.user_id]?.name || 'Unknown Farmer',
        farmer_email: profilesMap[d.user_id]?.email || '',
      }));

      setDetections(detectionsWithProfiles);
    } catch (err) {
      console.error('Error fetching detections:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetections();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('pest_detections_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pest_detections',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchDetections(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDetections]);

  const updateDetectionStatus = async (
    detectionId: string,
    status: DetectionStatus,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-detection', {
        body: {
          detection_id: detectionId,
          status,
          notes,
        },
      });

      if (error) throw error;

      toast.success(`Detection ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
      await fetchDetections();
      return data;
    } catch (err) {
      console.error('Error updating detection:', err);
      toast.error('Failed to update detection status');
      throw err;
    }
  };

  const uploadDetection = async (data: {
    pest_type: string;
    confidence: number;
    crop_type: string;
    latitude?: number;
    longitude?: number;
    location_name?: string;
    image_base64?: string;
  }) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('upload-detection', {
        body: data,
      });

      if (error) throw error;

      toast.success('Detection uploaded successfully');
      await fetchDetections();
      return result;
    } catch (err) {
      console.error('Error uploading detection:', err);
      toast.error('Failed to upload detection');
      throw err;
    }
  };

  const getStats = () => {
    const pending = detections.filter((d) => d.status === 'pending').length;
    const verified = detections.filter((d) => d.status === 'verified').length;
    const rejected = detections.filter((d) => d.status === 'rejected').length;
    return { total: detections.length, pending, verified, rejected };
  };

  return {
    detections,
    isLoading,
    error,
    updateDetectionStatus,
    uploadDetection,
    refetch: fetchDetections,
    getStats,
  };
}
