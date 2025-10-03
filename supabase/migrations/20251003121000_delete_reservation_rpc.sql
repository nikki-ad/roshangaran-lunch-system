-- RPC to delete reservation by id with SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.delete_reservation(p_reservation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the reservation
  DELETE FROM public.reservations WHERE id = p_reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_reservation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_reservation(uuid) TO anon, authenticated;


