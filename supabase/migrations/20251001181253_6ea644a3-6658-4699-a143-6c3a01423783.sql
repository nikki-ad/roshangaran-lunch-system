-- جدول منو برای نگهداری منوی هفته
CREATE TABLE IF NOT EXISTS public.menu (
  id INTEGER PRIMARY KEY DEFAULT 1,
  menu_text TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- داده اولیه برای منو
INSERT INTO public.menu (id, menu_text) 
VALUES (1, 'منوی هفته هنوز تنظیم نشده است.')
ON CONFLICT (id) DO NOTHING;

-- جدول رزروها
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('temporary', 'final')),
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ایندکس برای جستجوی سریع‌تر
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON public.reservations(created_at DESC);

-- فعال‌سازی RLS (برای امنیت)
ALTER TABLE public.menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Policy های عمومی (چون نیازی به authentication نیست)
-- همه می‌توانند منو را بخوانند
CREATE POLICY "Anyone can read menu"
  ON public.menu
  FOR SELECT
  USING (true);


-- فقط ادمین می‌تواند منو را ویرایش کند (بعداً محدود می‌شود)
CREATE POLICY "Anyone can update menu"
  ON public.menu
  FOR UPDATE
  USING (true);

-- همه می‌توانند رزرو ایجاد کنند
CREATE POLICY "Anyone can insert reservations"
  ON public.reservations
  FOR INSERT
  WITH CHECK (true);

-- همه می‌توانند رزروها را بخوانند
CREATE POLICY "Anyone can read reservations"
  ON public.reservations
  FOR SELECT
  USING (true);

-- ایجاد bucket برای نگهداری فیش‌ها
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Policy برای آپلود فیش
CREATE POLICY "Anyone can upload receipts"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'receipts');

-- Policy برای دیدن فیش‌ها
CREATE POLICY "Anyone can view receipts"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'receipts');

-- تابع برای به‌روزرسانی خودکار زمان
CREATE OR REPLACE FUNCTION update_menu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger برای به‌روزرسانی زمان
CREATE TRIGGER update_menu_timestamp
  BEFORE UPDATE ON public.menu
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_updated_at();