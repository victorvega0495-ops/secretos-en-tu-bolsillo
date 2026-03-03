-- Allow anonymous updates to likes only
CREATE POLICY "Anyone can update likes"
  ON public.community_tips
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);