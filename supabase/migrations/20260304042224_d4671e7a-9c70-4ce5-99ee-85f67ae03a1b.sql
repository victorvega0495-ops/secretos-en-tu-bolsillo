
-- Drop old table
DROP TABLE IF EXISTS public.day_videos;

-- Create day_assets table
CREATE TABLE public.day_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign text NOT NULL,
  day_number integer NOT NULL,
  asset_type text NOT NULL,
  storage_url text NOT NULL,
  file_name text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign, day_number, asset_type)
);

ALTER TABLE public.day_assets ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read day_assets" ON public.day_assets FOR SELECT USING (true);
-- No anonymous write — admin writes via service role or we allow anon for now since no auth
CREATE POLICY "Anyone can insert day_assets" ON public.day_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update day_assets" ON public.day_assets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete day_assets" ON public.day_assets FOR DELETE USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-assets', 'campaign-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read campaign-assets" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-assets');
CREATE POLICY "Public insert campaign-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'campaign-assets');
CREATE POLICY "Public update campaign-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'campaign-assets');
CREATE POLICY "Public delete campaign-assets" ON storage.objects FOR DELETE USING (bucket_id = 'campaign-assets');
