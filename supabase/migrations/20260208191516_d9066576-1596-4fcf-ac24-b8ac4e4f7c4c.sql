-- Add LGU response tracking fields to pest_detections
ALTER TABLE public.pest_detections
ADD COLUMN IF NOT EXISTS lgu_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS intervention_type TEXT;

-- Add category field to advisories (general_advisory or specific_response)
ALTER TABLE public.advisories
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general_advisory',
ADD COLUMN IF NOT EXISTS target_farmer_id UUID;

-- Create messages table for admin-farmer communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_id UUID REFERENCES public.pest_detections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies: users can view their own messages (sent or received)
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can mark their received messages as read
CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = recipient_id);

-- LGU admins can view all messages
CREATE POLICY "LGU admins can view all messages"
ON public.messages
FOR SELECT
USING (has_role(auth.uid(), 'lgu_admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;