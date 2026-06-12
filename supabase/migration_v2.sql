-- ============================================================
-- Fit Me v2 — Database Migration (Idempotent / Safe to Run Multiple Times)
-- Run this in Supabase SQL Editor AFTER the initial schema.sql
-- ============================================================

-- 1. Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('Male', 'Female', 'Other')),
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS height_ft integer,
  ADD COLUMN IF NOT EXISTS height_in integer,
  ADD COLUMN IF NOT EXISTS height_unit text DEFAULT 'cm' CHECK (height_unit IN ('cm', 'ft')),
  ADD COLUMN IF NOT EXISTS current_weight_kg numeric,
  ADD COLUMN IF NOT EXISTS target_weight_kg numeric,
  ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  ADD COLUMN IF NOT EXISTS activity_level text CHECK (
    activity_level IN ('Sedentary', 'Light', 'Moderate', 'Active', 'Very Active')
  ),
  ADD COLUMN IF NOT EXISTS goal text CHECK (goal IN ('lose', 'maintain', 'gain')),
  ADD COLUMN IF NOT EXISTS bmr numeric,
  ADD COLUMN IF NOT EXISTS tdee numeric,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Add image_url column to food_logs
ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS image_url text;

-- 3. Create storage bucket policies (run after creating buckets in dashboard)
-- Note: You must first create the 'food-snaps' and 'avatars' buckets
-- via the Supabase Dashboard > Storage > New Bucket

-- Allow authenticated users to upload to food_snaps
DROP POLICY IF EXISTS "Users can upload food snaps" ON storage.objects;
CREATE POLICY "Users can upload food snaps"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'food-snaps' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to food_snaps
DROP POLICY IF EXISTS "Public read access for food snaps" ON storage.objects;
CREATE POLICY "Public read access for food snaps"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'food-snaps');

-- Allow users to delete their own food snaps
DROP POLICY IF EXISTS "Users can delete own food snaps" ON storage.objects;
CREATE POLICY "Users can delete own food snaps"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'food-snaps' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to avatars
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
CREATE POLICY "Public read access for avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Cleanup function for 5-day old food images
-- IMPORTANT: This only nulls the image_url column. 
-- The actual storage file deletion must be done via Edge Function
-- because storage.objects can't be manipulated from plpgsql.
-- The food_logs rows (with macro data) are NEVER deleted.
CREATE OR REPLACE FUNCTION public.cleanup_old_food_images()
RETURNS TABLE(image_url_cleared text) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.food_logs
  SET image_url = NULL
  WHERE image_url IS NOT NULL
    AND logged_at < NOW() - INTERVAL '5 days'
  RETURNING image_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Old function kept for backwards compatibility but is now a no-op
DROP FUNCTION IF EXISTS public.cleanup_old_food_logs();
