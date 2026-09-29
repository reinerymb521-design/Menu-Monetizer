-- Unified administrator access for the Spanish AudiVerse schema.
-- Keeps compatibility with the older es_admin flag and user_roles table.

ALTER TABLE IF EXISTS public.perfiles
  ADD COLUMN IF NOT EXISTS es_administrador BOOLEAN NOT NULL DEFAULT false;

UPDATE public.perfiles
SET es_administrador = true
WHERE es_admin = true AND es_administrador IS DISTINCT FROM true;

CREATE OR REPLACE FUNCTION public.is_audiverse_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE (perfiles.id = auth.uid() OR perfiles.user_id = auth.uid())
      AND (COALESCE(perfiles.es_administrador, false) OR COALESCE(perfiles.es_admin, false))
  )
  OR public.has_role(auth.uid(), 'admin');
$$;

-- This is the concrete version of the requested policy for the social layer:
-- administrators can manage moderation-sensitive social content.
DROP POLICY IF EXISTS "Permitir solo a administradores" ON public.social_posts;
CREATE POLICY "Permitir solo a administradores"
  ON public.social_posts
  FOR ALL
  USING (public.is_audiverse_admin())
  WITH CHECK (public.is_audiverse_admin());

DROP POLICY IF EXISTS "Administrators can view all Spanish profiles" ON public.perfiles;
CREATE POLICY "Administrators can view all Spanish profiles"
  ON public.perfiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR auth.uid() = user_id
    OR public.is_audiverse_admin()
  );

DROP POLICY IF EXISTS "Administrators can update Spanish profiles" ON public.perfiles;
CREATE POLICY "Administrators can update Spanish profiles"
  ON public.perfiles
  FOR UPDATE
  USING (public.is_audiverse_admin() OR auth.uid() = id OR auth.uid() = user_id)
  WITH CHECK (public.is_audiverse_admin() OR auth.uid() = id OR auth.uid() = user_id);

ALTER TABLE IF EXISTS public.suscripciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Administrators can view all Spanish subscriptions" ON public.suscripciones;
CREATE POLICY "Administrators can view all Spanish subscriptions"
  ON public.suscripciones
  FOR SELECT
  USING (public.is_audiverse_admin());