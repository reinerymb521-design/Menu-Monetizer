-- AudiVerse social reading network.
-- Identity always comes from auth.uid(); the browser never chooses the owner.

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS profile_public BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE IF EXISTS public.perfiles
  ADD COLUMN IF NOT EXISTS perfil_publico BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 160),
  description TEXT,
  cover_url TEXT,
  book_path TEXT,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'followers', 'private')),
  is_official BOOLEAN NOT NULL DEFAULT false,
  official_label TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT official_posts_have_label CHECK (
    NOT is_official OR length(trim(COALESCE(official_label, ''))) > 0
  )
);

CREATE INDEX IF NOT EXISTS social_posts_feed_idx
  ON public.social_posts (visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS social_posts_author_idx
  ON public.social_posts (author_id, created_at DESC);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.social_post_likes (
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.social_post_likes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.social_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_post_comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS social_post_comments_post_idx
  ON public.social_post_comments (post_id, created_at);

CREATE TABLE IF NOT EXISTS public.social_post_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT CHECK (content IS NULL OR length(trim(content)) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE public.social_post_reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.social_post_shares (
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.social_post_shares ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.social_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, target_id),
  CHECK (requester_id <> target_id)
);
ALTER TABLE public.social_access_requests ENABLE ROW LEVEL SECURITY;

-- Public feed rows are public by post choice. A private profile can still
-- publish an individual book by selecting Public.
CREATE POLICY "Public can view visible social posts"
  ON public.social_posts FOR SELECT
  USING (
    is_official
    OR visibility = 'public'
    OR author_id = auth.uid()
    OR (
      visibility = 'followers'
      AND EXISTS (
        SELECT 1
        FROM public.followers f
        WHERE f.follower_id = auth.uid()
          AND f.following_id = social_posts.author_id
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.social_access_requests ar
      WHERE ar.requester_id = auth.uid()
        AND ar.target_id = social_posts.author_id
        AND ar.status = 'accepted'
    )
  );

CREATE POLICY "Users can publish their own social posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id AND is_official = false);

CREATE POLICY "Users can edit their own social posts"
  ON public.social_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id AND is_official = false);

CREATE POLICY "Users or admins can delete social posts"
  ON public.social_posts FOR DELETE
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read social likes"
  ON public.social_post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like as themselves"
  ON public.social_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their likes"
  ON public.social_post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read visible social comments"
  ON public.social_post_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.social_posts p
      WHERE p.id = post_id AND (
        p.is_official OR p.visibility = 'public' OR p.author_id = auth.uid()
        OR (p.visibility = 'followers' AND EXISTS (
          SELECT 1 FROM public.followers f
          WHERE f.follower_id = auth.uid() AND f.following_id = p.author_id
        ))
        OR EXISTS (
          SELECT 1 FROM public.social_access_requests ar
          WHERE ar.requester_id = auth.uid()
            AND ar.target_id = p.author_id
            AND ar.status = 'accepted'
        )
      ))
  );
CREATE POLICY "Users can create their own comments"
  ON public.social_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments"
  ON public.social_post_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read visible social reviews"
  ON public.social_post_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.social_posts p
    WHERE p.id = post_id AND (
      p.is_official OR p.visibility = 'public' OR p.author_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.social_access_requests ar
        WHERE ar.requester_id = auth.uid()
          AND ar.target_id = p.author_id
          AND ar.status = 'accepted'
      )
    )));
CREATE POLICY "Users can create their own reviews"
  ON public.social_post_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their own reviews"
  ON public.social_post_reviews FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews"
  ON public.social_post_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read social shares"
  ON public.social_post_shares FOR SELECT USING (true);
CREATE POLICY "Users can share as themselves"
  ON public.social_post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their shares"
  ON public.social_post_shares FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Requesters and targets can read access requests"
  ON public.social_access_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "Users can request access as themselves"
  ON public.social_access_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND requester_id <> target_id);
CREATE POLICY "Profile owners can answer access requests"
  ON public.social_access_requests FOR UPDATE
  USING (auth.uid() = target_id)
  WITH CHECK (auth.uid() = target_id);
CREATE POLICY "Requesters can cancel access requests"
  ON public.social_access_requests FOR DELETE
  USING (auth.uid() = requester_id);

-- Keep visible counters denormalized for a fast feed.
CREATE OR REPLACE FUNCTION public.update_social_post_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.social_posts
  SET like_count = GREATEST(0, like_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END)
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
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.social_posts
  SET comment_count = GREATEST(0, comment_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END)
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
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.social_posts
  SET share_count = GREATEST(0, share_count + CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END)
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS social_post_share_count ON public.social_post_shares;
CREATE TRIGGER social_post_share_count
AFTER INSERT OR DELETE ON public.social_post_shares
FOR EACH ROW EXECUTE FUNCTION public.update_social_post_share_count();

-- Official activity exists before the first user creates a post.
INSERT INTO public.social_posts
  (title, description, visibility, is_official, official_label)
SELECT seed.title, seed.description, 'public', true, 'Equipo AudiVerse'
FROM (VALUES
  ('¡Bienvenido a AudiVerse!', 'Estamos felices de abrir nuestras puertas a los primeros lectores. ¿Qué estás leyendo hoy?'),
  ('Ana Karenina: un clásico que nunca falla', 'Hoy recomendamos Ana Karenina. Un clásico que siempre merece una nueva lectura.'),
  ('Elige tu próxima aventura', 'Comparte el libro que te llevó a otro mundo y ayuda a otro lector a encontrarlo.'),
  ('Historias para escuchar', 'Guarda tus favoritos y descubre nuevas voces para acompañar tus momentos.'),
  ('La comunidad crece contigo', 'Tu reseña puede ser el comienzo de la próxima gran lectura de alguien.')
) AS seed(title, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.social_posts p
  WHERE p.is_official = true AND p.title = seed.title
);

-- User uploads use the existing Supabase buckets but must live in an
-- owner-prefixed path. The UI stores the resulting path with the post.
DROP POLICY IF EXISTS "AudiVerse users upload social covers" ON storage.objects;
CREATE POLICY "AudiVerse users upload social covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'book-covers' AND name LIKE (auth.uid()::text || '/%'));

DROP POLICY IF EXISTS "AudiVerse users upload social books" ON storage.objects;
CREATE POLICY "AudiVerse users upload social books"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'book-files' AND name LIKE (auth.uid()::text || '/%'));

DROP POLICY IF EXISTS "AudiVerse users update social covers" ON storage.objects;
CREATE POLICY "AudiVerse users update social covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'book-covers' AND name LIKE (auth.uid()::text || '/%'));

DROP POLICY IF EXISTS "AudiVerse users delete social covers" ON storage.objects;
CREATE POLICY "AudiVerse users delete social covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'book-covers' AND name LIKE (auth.uid()::text || '/%'));