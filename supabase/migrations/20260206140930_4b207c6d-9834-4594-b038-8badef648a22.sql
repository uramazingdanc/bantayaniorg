-- Create farmer_farms table for multiple farm locations per user
CREATE TABLE public.farmer_farms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_number INT NOT NULL CHECK (farm_number BETWEEN 1 AND 3),
  farm_name TEXT,
  landmark TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  size TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, farm_number)
);

-- Enable RLS
ALTER TABLE public.farmer_farms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for farmer_farms
CREATE POLICY "Users can view their own farms" 
ON public.farmer_farms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farms" 
ON public.farmer_farms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farms" 
ON public.farmer_farms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farms" 
ON public.farmer_farms 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "LGU admins can view all farms" 
ON public.farmer_farms 
FOR SELECT 
USING (has_role(auth.uid(), 'lgu_admin'::app_role));

-- Add farm_id column to pest_detections to track which farm the detection is from
ALTER TABLE public.pest_detections ADD COLUMN farm_id UUID REFERENCES public.farmer_farms(id);

-- Add farmer_notes column to pest_detections for farmer comments during upload
ALTER TABLE public.pest_detections ADD COLUMN farmer_notes TEXT;

-- Create trigger to update updated_at
CREATE TRIGGER update_farmer_farms_updated_at
BEFORE UPDATE ON public.farmer_farms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for farmer_farms
ALTER PUBLICATION supabase_realtime ADD TABLE public.farmer_farms;