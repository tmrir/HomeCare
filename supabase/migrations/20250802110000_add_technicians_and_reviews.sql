-- Create technicians table
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT UNIQUE,
  skills TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  location JSONB NOT NULL, -- {lat, lng, address}
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  rating FLOAT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  satisfaction_level TEXT CHECK (satisfaction_level IN ('very_satisfied', 'satisfied', 'neutral', 'dissatisfied')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_technicians_status ON public.technicians(status);
CREATE INDEX idx_technicians_skills ON public.technicians USING GIN(skills);
CREATE INDEX idx_reviews_technician_id ON public.reviews(technician_id);

-- Enable RLS on new tables
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for technicians table
CREATE POLICY "Allow public read access to technicians" 
ON public.technicians 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin full access to technicians"
ON public.technicians
USING (true)
WITH CHECK (true);

-- Policies for reviews table
CREATE POLICY "Allow public read access to reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Update service_requests table to include tracking fields
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS tracking_code TEXT GENERATED ALWAYS AS (
  'HC' || to_char(created_at, 'YYMM') || id::text
) STORED;

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the new tables
CREATE TRIGGER update_technicians_updated_at
BEFORE UPDATE ON public.technicians
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- Create a function to update technician ratings
CREATE OR REPLACE FUNCTION public.update_technician_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.technicians t
  SET 
    rating = (
      SELECT COALESCE(AVG(r.rating), 0)
      FROM public.reviews r
      WHERE r.technician_id = NEW.technician_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.technician_id = NEW.technician_id
    )
  WHERE t.id = NEW.technician_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update technician rating on new review
CREATE TRIGGER after_review_insert
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_technician_rating();

-- Add a comment to the tracking_code column
COMMENT ON COLUMN public.service_requests.tracking_code IS 'Auto-generated tracking code in format HCYYMM<uuid>';

-- Add a comment to the satisfaction_level column
COMMENT ON COLUMN public.reviews.satisfaction_level IS 'User satisfaction level: very_satisfied, satisfied, neutral, dissatisfied';
