-- رفع مشکل امنیتی search_path
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

-- ایجاد مجدد trigger
CREATE TRIGGER update_menu_timestamp
  BEFORE UPDATE ON public.menu
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_updated_at();