-- ============================================================
-- Fit Me — Supabase Database Schema (Idempotent / Safe to Run Multiple Times)
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- 1. Profiles table
-- Stores user preferences and daily macro goals
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  daily_calories_goal integer NOT NULL DEFAULT 2000,
  daily_protein_goal integer NOT NULL DEFAULT 80,
  daily_carbs_goal integer NOT NULL DEFAULT 250,
  daily_fat_goal integer NOT NULL DEFAULT 65,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies (Drop first if exists to prevent "already exists" errors)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Food logs table
-- Stores each meal snap with AI-analyzed macro data
CREATE TABLE IF NOT EXISTS public.food_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  meal_category text NOT NULL CHECK (
    meal_category IN ('Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner')
  ),
  items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_calories numeric NOT NULL DEFAULT 0,
  total_protein numeric NOT NULL DEFAULT 0,
  total_carbs numeric NOT NULL DEFAULT 0,
  total_fats numeric NOT NULL DEFAULT 0,
  total_fiber numeric NOT NULL DEFAULT 0,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- Food logs RLS policies (Drop first if exists to prevent "already exists" errors)
DROP POLICY IF EXISTS "Users can view own food logs" ON public.food_logs;
CREATE POLICY "Users can view own food logs"
  ON public.food_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own food logs" ON public.food_logs;
CREATE POLICY "Users can insert own food logs"
  ON public.food_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own food logs" ON public.food_logs;
CREATE POLICY "Users can update own food logs"
  ON public.food_logs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own food logs" ON public.food_logs;
CREATE POLICY "Users can delete own food logs"
  ON public.food_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Auto-create profile on signup
-- This trigger runs when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger first if exists to prevent duplicate trigger errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger first if exists to prevent duplicate trigger errors
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_logs_user_id ON public.food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_logged_at ON public.food_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, logged_at);
