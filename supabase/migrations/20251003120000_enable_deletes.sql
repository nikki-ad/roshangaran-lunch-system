-- Allow deleting reservations and receipt files

-- Policy: anyone can delete reservations (adjust later if needed)
CREATE POLICY IF NOT EXISTS "Anyone can delete reservations"
  ON public.reservations
  FOR DELETE
  USING (true);

-- Storage delete policy for receipts bucket
CREATE POLICY IF NOT EXISTS "Anyone can delete receipts"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'receipts');


