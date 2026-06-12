-- =======================================================
-- SUPABASE MIGRATION: ADD MISSING COLUMNS FOR CUSTOM TEMPLATES
-- =======================================================
-- This script ensures that the 'custom_templates' table contains
-- the 'demo_url' and 'category_label' columns with appropriate data types.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://supabase.com
-- 2. Open the SQL Editor on the left sidebar.
-- 3. Click "New Query" / "New Snippet".
-- 4. Paste this entire query and click "Run".
-- =======================================================

-- 1. Add demo_url column if it doesn't exist
ALTER TABLE public.custom_templates 
ADD COLUMN IF NOT EXISTS demo_url TEXT;

-- 2. Add category_label column if it doesn't exist (to prevent any potential layout categorization issues)
ALTER TABLE public.custom_templates 
ADD COLUMN IF NOT EXISTS category_label TEXT;

-- 3. Notify schema cache refresh (automatic in Supabase, but it is good practice)
COMMENT ON COLUMN public.custom_templates.demo_url IS 'URL link to preview live template website, mapped to demoUrl';
COMMENT ON COLUMN public.custom_templates.category_label IS 'Descriptive category text used for filtering layout items';
