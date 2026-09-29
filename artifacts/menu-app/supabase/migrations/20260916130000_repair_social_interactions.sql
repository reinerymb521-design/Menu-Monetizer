-- Repair the social interaction layer.
-- Counters are kept in sync by triggers, while the client also reads the
-- interaction rows so old counters can never hide existing activity.

ALTER TABLE IF EXISTS public.social_posts
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.social_post_likes (
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.social_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_post_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT CHECK (content IS NULL OR length(trim(content)) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.social_post_shares (
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS social_post_likes_post_idx
  ON public.social_post_likes(post_id);
CREATE INDEX IF NOT EXISTS social_post_comments_post_idx
  ON public.social_post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS social_post_reviews_post_idx
  ON public.social_post_reviews(post_id, created_at);
CREATE INDEX IF NOT EXISTS social_post_shares_post_idx
  ON public.social_post_shares(post_id);

ALTER TABLE public.social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read social likes" ON public.social_post_likes;
CREATE POLICY "Anyone can read social likes"
  ON public.social_post_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can like as themselves" ON public.social_post_likes;
CREATE POLICY "Users can like as themselves"
  ON public.social_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their likes" ON public.social_post_likes;
CREATE POLICY "Users can remove their likes"
  ON public.social_post_likes FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read visible social comments" ON public.social_post_comments;
CREATE POLICY "Anyone can read visible social comments"
  ON public.social_post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.social_posts p
      WHERE p.id = post_id
        AND (
          p.visibility = 'public'
          OR COALESCE(p.author_id, p.user_id) = auth.uid()
          OR (
            p.visibility = 'followers'
            AND EXISTS (
              SELECT 1
              FROM public.followers f
              WHERE f.follower_id = auth.uid()
                AND f.following_id = COALESCE(p.author_id, p.user_id)
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can create their own comments" ON public.social_post_comments;
CREATE POLICY "Users can create their own comments"
  ON public.social_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.social_post_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.social_post_comments FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read visible social reviews" ON public.social_post_reviews;
CREATE POLICY "Anyone can read visible social reviews"
  ON public.social_post_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.social_posts p
      WHERE p.id = post_id
        AND (
          p.visibility = 'public'
          OR COALESCE(p.author_id, p.user_id) = auth.uid()
          OR (
            p.visibility = 'followers'
            AND EXISTS (
              SELECT 1
              FROM public.followers f
              WHERE f.follower_id = auth.uid()
                AND f.following_id = COALESCE(p.author_id, p.user_id)
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can create their own reviews" ON public.social_post_reviews;
CREATE POLICY "Users can create their own reviews"
  ON public.social_post_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can edit their own reviews" ON public.social_post_reviews;
CREATE POLICY "Users can edit their own reviews"
  ON public.social_post_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.social_post_reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.social_post_reviews FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read social shares" ON public.social_post_shares;
CREATE POLICY "Anyone can read social shares"
  ON public.social_post_shares FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can share as themselves" ON public.social_post_shares;
CREATE POLICY "Users can share as themselves"
  ON public.social_post_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their shares" ON public.social_post_shares;
CREATE POLICY "Users can remove their shares"
  ON public.social_post_shares FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_social_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.social_posts
  SET like_count = GREATEST(
    0,
    like_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS social_post_like_count ON public.social_post_likes;
CREATE TRIGGER social_post_like_count
AFTER INSERT OR DELETE ON public.social_post_likes
FOR EACH ROW EXECUTE FUNCTION public.update_social_post_like_count();

CREATE OR REPLACE FUNCTION public.update_social_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.social_posts
  SET comment_count = GREATEST(
    0,
    comment_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS social_post_comment_count ON public.social_post_comments;
CREATE TRIGGER social_post_comment_count
AFTER INSERT OR DELETE ON public.social_post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_social_post_comment_count();

CREATE OR REPLACE FUNCTION public.update_social_post_share_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.social_posts
  SET share_count = GREATEST(
    0,
    share_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS social_post_share_count ON public.social_post_shares;
CREATE TRIGGER social_post_share_count
AFTER INSERT OR DELETE ON public.social_post_shares
FOR EACH ROW EXECUTE FUNCTION public.update_social_post_share_count();

-- Backfill existing posts so old interactions are reflected immediately.
UPDATE public.social_posts p
SET like_count = (
      SELECT COUNT(*)::INTEGER
      FROM public.social_post_likes l
      WHERE l.post_id = p.id
    ),
    comment_count = (
      SELECT COUNT(*)::INTEGER
      FROM public.social_post_comments c
      WHERE c.post_id = p.id
    ),
    share_count = (
      SELECT COUNT(*)::INTEGER
      FROM public.social_post_shares s
      WHERE s.post_id = p.id
    );