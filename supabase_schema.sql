-- ==========================================
-- SUPABASE DATABASE SCHEMA FOR VLOXA PLATFORM
-- ==========================================
-- This file contains the complete SQL queries to set up the database tables 
-- and columns required for Vloxa, including the fix for the custom_templates table.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard (https://supabase.com).
-- 2. Open the SQL Editor from the left navigation panel.
-- 3. Click "New Query".
-- 4. Paste the SQL script below and click "Run".
-- ==========================================

-- 1. Create or alter the custom_templates table
CREATE TABLE IF NOT EXISTS public.custom_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT,
    image TEXT,
    demo_url TEXT, -- <=== THIS IS THE NEW / MISSING COLUMN FOR THE TEMPLATE DEMO URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists but 'demo_url' or other columns are missing, run these:
ALTER TABLE public.custom_templates ADD COLUMN IF NOT EXISTS demo_url TEXT;
ALTER TABLE public.custom_templates ADD COLUMN IF NOT EXISTS category_label TEXT;


-- 2. Create the user_profiles table for RBAC / Profile tracking
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    biz_type TEXT DEFAULT 'UMKM',
    website_title TEXT DEFAULT 'Toko Online Saya',
    theme_color TEXT DEFAULT '#dbef1a',
    role TEXT DEFAULT 'member', -- 'admin' or 'member'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If user_profiles exists but 'role' is missing:
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';


-- 3. Create the user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. Create the domain_requests table
CREATE TABLE IF NOT EXISTS public.domain_requests (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    status TEXT DEFAULT 'requested', -- 'checked', 'requested', 'registered'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 5. Create the app_config table for admin layout controls (Featured layouts)
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    template_ids TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES (OPTIONAL)
-- ==========================================
-- Enable RLS and setup rules for secure access.

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read of user profiles" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individual update of own user profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert of own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Enable RLS on user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read of own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert of own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individual delete of own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);


-- Enable RLS on domain_requests
ALTER TABLE public.domain_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read of own domain requests" ON public.domain_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert of own domain requests" ON public.domain_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individual delete of own domain requests" ON public.domain_requests
    FOR DELETE USING (auth.uid() = user_id);


-- Enable RLS on custom_templates (Public Read, Admin Write)
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of custom templates" ON public.custom_templates
    FOR SELECT USING (true);


-- Enable RLS on app_config (Public Read, Admin Write)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of app configurations" ON public.app_config
    FOR SELECT USING (true);
