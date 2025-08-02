-- Create service requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('plumbing', 'electrical', 'ac', 'other')),
  issue_description TEXT NOT NULL,
  preferred_time TEXT NOT NULL CHECK (preferred_time IN ('morning', 'evening')),
  location JSONB NOT NULL, -- {lat, lng, neighborhood}
  is_different_address BOOLEAN DEFAULT FALSE,
  needs_parts BOOLEAN DEFAULT FALSE,
  part_type TEXT,
  part_other TEXT,
  needs_installation BOOLEAN DEFAULT FALSE,
  photo_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  assigned_technician TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for public read/write (no authentication required)
CREATE POLICY "Allow public read access to service requests" 
ON public.service_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert of service requests" 
ON public.service_requests 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admin updates (for future admin authentication)
CREATE POLICY "Allow admin updates to service requests" 
ON public.service_requests 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create parts catalog table
CREATE TABLE public.parts_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('ac', 'plumbing', 'electrical', 'other')),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for parts catalog
ALTER TABLE public.parts_catalog ENABLE ROW LEVEL SECURITY;

-- Allow public read access to parts catalog
CREATE POLICY "Allow public read access to parts catalog" 
ON public.parts_catalog 
FOR SELECT 
USING (is_active = true);

-- Insert sample parts data
INSERT INTO public.parts_catalog (category, name, description) VALUES
('ac', 'مكيف شباك', 'مكيف هواء شباك بقدرات مختلفة'),
('ac', 'مكيف سبليت', 'مكيف هواء سبليت بقدرات مختلفة'),
('plumbing', 'صنبور', 'صنبور مياه للمطبخ أو الحمام'),
('plumbing', 'دش', 'رأس دش للحمام'),
('plumbing', 'حوض غسالة', 'حوض غسيل للمطبخ أو الحمام'),
('electrical', 'مفتاح كهرباء', 'مفتاح كهرباء عادي أو ذكي'),
('electrical', 'مقبس كهرباء', 'مقبس كهرباء عادي أو USB');