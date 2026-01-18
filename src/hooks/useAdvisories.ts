import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Advisory = Database['public']['Tables']['advisories']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AdvisoryWithProfile extends Advisory {
  creator_name?: string;
}

export function useAdvisories() {
  const [advisories, setAdvisories] = useState<AdvisoryWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAdvisories = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch advisories
      const { data: advisoriesData, error: advisoriesError } = await supabase
        .from('advisories')
        .select('*')
        .order('created_at', { ascending: false });

      if (advisoriesError) throw advisoriesError;

      // Fetch profiles for the advisory creators
      const creatorIds = [...new Set((advisoriesData || []).map(a => a.created_by))];
      
      let profilesMap: Record<string, Profile> = {};
      
      if (creatorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', creatorIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, Profile>);
        }
      }

      // Merge advisories with profile data
      const advisoriesWithProfiles: AdvisoryWithProfile[] = (advisoriesData || []).map(a => ({
        ...a,
        creator_name: profilesMap[a.created_by]?.name || 'Admin',
      }));

      setAdvisories(advisoriesWithProfiles);
    } catch (err) {
      console.error('Error fetching advisories:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvisories();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('advisories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advisories',
        },
        () => {
          fetchAdvisories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAdvisories]);

  const createAdvisory = async (advisory: {
    title: string;
    content: string;
    severity: string;
    affected_crops: string[];
    affected_regions: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('advisories')
        .insert({
          ...advisory,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Advisory created successfully');
      await fetchAdvisories();
      return data;
    } catch (err) {
      console.error('Error creating advisory:', err);
      toast.error('Failed to create advisory');
      throw err;
    }
  };

  const updateAdvisory = async (id: string, updates: Partial<Advisory>) => {
    try {
      const { data, error } = await supabase
        .from('advisories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Advisory updated successfully');
      await fetchAdvisories();
      return data;
    } catch (err) {
      console.error('Error updating advisory:', err);
      toast.error('Failed to update advisory');
      throw err;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateAdvisory(id, { is_active: !isActive });
  };

  const deleteAdvisory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('advisories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Advisory deleted successfully');
      await fetchAdvisories();
    } catch (err) {
      console.error('Error deleting advisory:', err);
      toast.error('Failed to delete advisory');
      throw err;
    }
  };

  return {
    advisories,
    isLoading,
    error,
    createAdvisory,
    updateAdvisory,
    toggleActive,
    deleteAdvisory,
    refetch: fetchAdvisories,
  };
}
