ALTER TABLE public.day_assets ADD COLUMN IF NOT EXISTS product_id text DEFAULT '';
ALTER TABLE public.day_assets ADD COLUMN IF NOT EXISTS product_description text DEFAULT '';