-- ALAMAR BEACH HOUSE - Database Schema
-- Tables: admin_users, booking_requests, calendar_blocks

-- Admin Users Table (for managing admin access)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Booking Requests Table
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calendar Blocks Table (for blocking dates)
CREATE TABLE IF NOT EXISTS public.calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'booking')),
  booking_request_id UUID REFERENCES public.booking_requests(id) ON DELETE SET NULL,
  created_by_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
-- Allow authenticated users to view admin_users (for checking their own role)
CREATE POLICY "admin_users_select_authenticated" ON public.admin_users 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- RLS Policies for booking_requests
-- Allow anyone to insert booking requests (public form)
CREATE POLICY "booking_requests_insert_anon" ON public.booking_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to view all booking requests
CREATE POLICY "booking_requests_select_authenticated" ON public.booking_requests 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to update booking requests
CREATE POLICY "booking_requests_update_authenticated" ON public.booking_requests 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- RLS Policies for calendar_blocks
-- Allow anyone to view calendar blocks (for public availability calendar)
CREATE POLICY "calendar_blocks_select_anon" ON public.calendar_blocks 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert calendar blocks
CREATE POLICY "calendar_blocks_insert_authenticated" ON public.calendar_blocks 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update calendar blocks
CREATE POLICY "calendar_blocks_update_authenticated" ON public.calendar_blocks 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete calendar blocks
CREATE POLICY "calendar_blocks_delete_authenticated" ON public.calendar_blocks 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_requests_dates ON public.booking_requests(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON public.booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_dates ON public.calendar_blocks(start_date, end_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_requests_updated_at ON public.booking_requests;
CREATE TRIGGER update_booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
