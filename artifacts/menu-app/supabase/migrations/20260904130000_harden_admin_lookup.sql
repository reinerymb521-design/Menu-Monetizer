-- Compatibility fix for Spanish perfiles tables with different historical
-- column sets. The admin check must work even when user_id or
-- es_administrador is not present.

CREATE OR REPLACE FUNCTION public.is_audiverse_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  has_user_id BOOLEAN;
  has_email BOOLEAN;
  has_es_admin BOOLEAN;
  has_es_administrador BOOLEAN;
  identity_filter TEXT;
  admin_filter TEXT;
  profile_is_admin BOOLEAN := false;
  role_is_admin BOOLEAN := false;
  current_email TEXT := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
BEGIN
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF to_regclass('public.perfiles') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'perfiles'
        AND column_name = 'user_id'
    ) INTO has_user_id;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'perfiles'
        AND column_name = 'correo_electronico'
    ) INTO has_email;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'perfiles'
        AND column_name = 'es_admin'
    ) INTO has_es_admin;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'perfiles'
        AND column_name = 'es_administrador'
    ) INTO has_es_administrador;

    admin_filter := concat_ws(
      ' OR ',
      CASE WHEN has_es_admin THEN 'COALESCE(es_admin, false)' END,
      CASE WHEN has_es_administrador THEN 'COALESCE(es_administrador, false)' END
    );

    IF admin_filter <> '' THEN
      IF has_email AND has_user_id THEN
        identity_filter := '(id = $1 OR user_id = $1 OR lower(trim(correo_electronico)) = $2)';
        EXECUTE format(
          'SELECT EXISTS (
             SELECT 1 FROM public.perfiles
             WHERE %s AND (%s)
           )',
          identity_filter,
          admin_filter
        )
        INTO profile_is_admin
        USING current_user_id, current_email;
      ELSIF has_email THEN
        identity_filter := '(id = $1 OR lower(trim(correo_electronico)) = $2)';
        EXECUTE format(
          'SELECT EXISTS (
             SELECT 1 FROM public.perfiles
             WHERE %s AND (%s)
           )',
          identity_filter,
          admin_filter
        )
        INTO profile_is_admin
        USING current_user_id, current_email;
      ELSE
        identity_filter := CASE
          WHEN has_user_id THEN '(id = $1 OR user_id = $1)'
          ELSE 'id = $1'
        END;
        EXECUTE format(
          'SELECT EXISTS (
             SELECT 1 FROM public.perfiles
             WHERE %s AND (%s)
           )',
          identity_filter,
          admin_filter
        )
        INTO profile_is_admin
        USING current_user_id;
      END IF;
    END IF;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL THEN
    EXECUTE
      'SELECT EXISTS (
         SELECT 1 FROM public.user_roles
         WHERE user_id = $1 AND role::text = ''admin''
       )'
    INTO role_is_admin
    USING current_user_id;
  END IF;

  RETURN profile_is_admin OR role_is_admin;
END;
$$;

REVOKE ALL ON FUNCTION public.is_audiverse_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_audiverse_admin() TO authenticated;

-- Re-apply the administrator flag safely, even if the previous migration
-- stopped before completing because the table uses an older schema.
DO $$
BEGIN
  IF to_regclass('public.perfiles') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'perfiles'
         AND column_name = 'correo_electronico'
     )
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'perfiles'
         AND column_name = 'es_admin'
     ) THEN
    UPDATE public.perfiles
    SET es_admin = true
    WHERE lower(trim(correo_electronico)) = 'studioreygame@gmail.com';
  END IF;

  IF to_regclass('public.perfiles') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'perfiles'
         AND column_name = 'correo_electronico'
     )
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'perfiles'
         AND column_name = 'es_administrador'
     ) THEN
    UPDATE public.perfiles
    SET es_administrador = true
    WHERE lower(trim(correo_electronico)) = 'studioreygame@gmail.com';
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL
     AND to_regtype('public.app_role') IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::public.app_role
    FROM auth.users
    WHERE lower(email) = 'studioreygame@gmail.com'
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END
$$;