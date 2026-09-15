-- Make published social posts visible across accounts and keep follow actions
-- available for the Spanish AudiVerse schema.

ALTER TABLE IF EXISTS public.social_posts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF to_regclass('public.followers') IS NULL THEN
    CREATE TABLE public.followers (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (follower_id, following_id),
      CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
    );
  END IF;
END
$$;

ALTER TABLE IF EXISTS public.followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view followers" ON public.followers;
CREATE POLICY "Anyone can view followers"
  ON public.followers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.followers;
CREATE POLICY "Users can follow others"
  ON public.followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;
CREATE POLICY "Users can unfollow"
  ON public.followers FOR DELETE
  USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_followers_following
  ON public.followers(following_id);

ALTER TABLE IF EXISTS public.social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AudiVerse can view published social posts" ON public.social_posts;
CREATE POLICY "AudiVerse can view published social posts"
  ON public.social_posts FOR SELECT
  USING (
    visibility = 'public'
    OR author_id = auth.uid()
    OR user_id = auth.uid()
    OR (
      visibility = 'followers'
      AND EXISTS (
        SELECT 1
        FROM public.followers f
        WHERE f.follower_id = auth.uid()
          AND f.following_id = COALESCE(social_posts.author_id, social_posts.user_id)
      )
    )
  );