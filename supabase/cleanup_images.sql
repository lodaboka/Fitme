-- ============================================================
-- Fit Me v2.1 — 5-Day Image Cleanup Script
-- 
-- This script cleans up food snap images older than 5 days.
-- It does NOT delete food_logs rows — macro data stays forever.
--
-- HOW IT WORKS:
-- 1. Nulls `image_url` on food_logs rows older than 5 days
-- 2. Lists the storage paths that need deletion
--
-- USAGE:
-- Option A: Run manually in Supabase SQL Editor
-- Option B: Call from a Supabase Edge Function on a cron schedule
-- Option C: If on Pro tier, use pg_cron (see bottom of file)
-- ============================================================

-- Step 1: Get list of image URLs to be cleaned up (preview/dry-run)
SELECT id, image_url, logged_at 
FROM public.food_logs
WHERE image_url IS NOT NULL
  AND logged_at < NOW() - INTERVAL '5 days';

-- Step 2: Null out the image_url column (run this to execute)
-- This calls the function created in migration_v2.sql
SELECT * FROM public.cleanup_old_food_images();

-- ============================================================
-- STORAGE FILE DELETION
-- ============================================================
-- Supabase Storage files must be deleted via the API, not SQL.
-- Use the Supabase Dashboard > Storage > food-snaps bucket
-- to manually delete old files, OR deploy an Edge Function:
--
-- // edge-function: cleanup-images/index.ts
-- import { createClient } from '@supabase/supabase-js'
--
-- Deno.serve(async () => {
--   const supabase = createClient(
--     Deno.env.get('SUPABASE_URL')!,
--     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
--   )
--
--   // Get URLs that were just nulled
--   const { data: cleared } = await supabase.rpc('cleanup_old_food_images')
--
--   // Extract storage paths and delete files
--   for (const row of cleared || []) {
--     const url = row.image_url_cleared
--     if (!url) continue
--     // Extract path after /storage/v1/object/public/food-snaps/
--     const match = url.match(/food-snaps\/(.+?)(\?|$)/)
--     if (match) {
--       await supabase.storage.from('food-snaps').remove([match[1]])
--     }
--   }
--
--   return new Response(JSON.stringify({ cleaned: cleared?.length || 0 }))
-- })

-- ============================================================
-- PG_CRON (Supabase Pro tier only)
-- ============================================================
-- If you're on Pro tier, enable pg_cron and schedule:
--
-- SELECT cron.schedule(
--   'cleanup-old-food-images',
--   '0 3 * * *',  -- Run daily at 3 AM UTC
--   $$ SELECT * FROM public.cleanup_old_food_images() $$
-- );
