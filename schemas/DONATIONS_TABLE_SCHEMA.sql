-- Donations Table Schema for Supabase
-- ============================================
-- Copy and paste this entire SQL into Supabase SQL Editor and click "Run"
-- ============================================

-- Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donation_date DATE NOT NULL,
    donor_name VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    donation_type VARCHAR(50) DEFAULT 'General',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_date ON public.donations(donation_date DESC);
CREATE INDEX IF NOT EXISTS idx_donations_type ON public.donations(donation_type);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);

-- Enable RLS on donations table
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Allow all operations for public access (development/testing)
CREATE POLICY "Allow all operations" ON public.donations
    FOR ALL USING (true)
    WITH CHECK (true);

-- Done! The donations table is now ready to use.
-- You can now record donations in the Church Admin System.
