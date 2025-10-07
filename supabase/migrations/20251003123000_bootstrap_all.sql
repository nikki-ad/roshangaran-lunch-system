-- Idempotent bootstrap for new Supabase project

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.menu (
  id INTEGER PRIMARY KEY DEFAULT 1,
  menu_text TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.menu (id, menu_text)
VALUES (1, 'منوی هفته هنوز تنظیم نشده است.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('temporary', 'final')),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);

-- 3) RLS
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- 4) Policies (idempotent via DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='menu' AND policyname='Anyone can read menu'
  ) THEN
    CREATE POLICY "Anyone can read menu" ON public.menu FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='menu' AND policyname='Anyone can update menu'
  ) THEN
    CREATE POLICY "Anyone can update menu" ON public.menu FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Anyone can insert reservations'
  ) THEN
    CREATE POLICY "Anyone can insert reservations" ON public.reservations FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Anyone can read reservations'
  ) THEN
    CREATE POLICY "Anyone can read reservations" ON public.reservations FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reservations' AND policyname='Anyone can delete reservations'
  ) THEN
    CREATE POLICY "Anyone can delete reservations" ON public.reservations FOR DELETE USING (true);
  END IF;
END $$;

-- 5) Storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Ensure storage RLS is enabled (usually enabled by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Authenticated can upload receipts'
  ) THEN
    CREATE POLICY "Authenticated can upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Anyone can view receipts'
  ) THEN
    CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can delete receipts'
  ) THEN
    CREATE POLICY "Admins can delete receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'receipts');
  END IF;
END $$;

-- 6) Trigger to update menu.updated_at
DROP TRIGGER IF EXISTS update_menu_timestamp ON public.menu;
DROP FUNCTION IF EXISTS update_menu_updated_at();

CREATE OR REPLACE FUNCTION update_menu_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_menu_timestamp
  BEFORE UPDATE ON public.menu
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_updated_at();

-- 7) RPC for delete
CREATE OR REPLACE FUNCTION public.delete_reservation(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.reservations WHERE id = p_reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_reservation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_reservation(uuid) TO anon, authenticated;


