-- Keep the social_posts table compatible with the columns used by the
-- existing AudiVerse Supabase project.

ALTER TABLE IF EXISTS public.social_posts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS contenido TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_path TEXT;