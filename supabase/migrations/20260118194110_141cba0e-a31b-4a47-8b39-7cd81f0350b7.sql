-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('farmer', 'lgu_admin');

-- Create user_roles table (CRITICAL: roles stored separately for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    farm_location TEXT,
    farm_size TEXT,
    main_crop TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create detection status enum
CREATE TYPE public.detection_status AS ENUM ('pending', 'verified', 'rejected');

-- Create pest_detections table
CREATE TABLE public.pest_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    pest_type TEXT NOT NULL,
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    crop_type TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name TEXT,
    status detection_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pest_detections
ALTER TABLE public.pest_detections ENABLE ROW LEVEL SECURITY;

-- Create advisories table
CREATE TABLE public.advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    affected_crops TEXT[] NOT NULL DEFAULT '{}',
    affected_regions TEXT[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on advisories
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for detection images
INSERT INTO storage.buckets (id, name, public) VALUES ('detection-images', 'detection-images', true);

-- RLS Policies

-- User roles: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- User roles: LGU admins can view all roles
CREATE POLICY "LGU admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'lgu_admin'));

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Profiles: LGU admins can view all profiles
CREATE POLICY "LGU admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'lgu_admin'));

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Profiles: Allow insert for authenticated users
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Pest detections: Farmers can view their own detections
CREATE POLICY "Farmers can view their own detections"
ON public.pest_detections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Pest detections: LGU admins can view all detections
CREATE POLICY "LGU admins can view all detections"
ON public.pest_detections FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'lgu_admin'));

-- Pest detections: Users can insert their own detections
CREATE POLICY "Users can insert their own detections"
ON public.pest_detections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Pest detections: LGU admins can update any detection (for verification)
CREATE POLICY "LGU admins can update detections"
ON public.pest_detections FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'lgu_admin'));

-- Advisories: Anyone authenticated can view active advisories
CREATE POLICY "Authenticated users can view active advisories"
ON public.advisories FOR SELECT
TO authenticated
USING (is_active = true);

-- Advisories: LGU admins can view all advisories
CREATE POLICY "LGU admins can view all advisories"
ON public.advisories FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'lgu_admin'));

-- Advisories: LGU admins can insert advisories
CREATE POLICY "LGU admins can insert advisories"
ON public.advisories FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'lgu_admin'));

-- Advisories: LGU admins can update advisories
CREATE POLICY "LGU admins can update advisories"
ON public.advisories FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'lgu_admin'));

-- Advisories: LGU admins can delete advisories
CREATE POLICY "LGU admins can delete advisories"
ON public.advisories FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'lgu_admin'));

-- Storage policies for detection images
CREATE POLICY "Anyone can view detection images"
ON storage.objects FOR SELECT
USING (bucket_id = 'detection-images');

CREATE POLICY "Authenticated users can upload detection images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'detection-images');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from user metadata, default to 'farmer'
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'farmer');
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile and role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pest_detections_updated_at
  BEFORE UPDATE ON public.pest_detections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advisories_updated_at
  BEFORE UPDATE ON public.advisories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for pest_detections and advisories
ALTER PUBLICATION supabase_realtime ADD TABLE public.pest_detections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.advisories;