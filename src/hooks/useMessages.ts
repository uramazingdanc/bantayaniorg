import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  detection_id: string | null;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // Joined fields
  sender_name?: string;
  recipient_name?: string;
}

export function useMessages(detectionId?: string) {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (detectionId) {
        query = query.eq('detection_id', detectionId);
      } else {
        // Get all messages for current user
        query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, detectionId]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  const sendMessage = async (recipientId: string, content: string, detectionId?: string) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          detection_id: detectionId || null,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Message sent');
      await fetchMessages();
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      throw err;
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      await fetchMessages();
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const getUnreadCount = () => {
    if (!user) return 0;
    return messages.filter(m => m.recipient_id === user.id && !m.is_read).length;
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    getUnreadCount,
    refetch: fetchMessages,
  };
}
