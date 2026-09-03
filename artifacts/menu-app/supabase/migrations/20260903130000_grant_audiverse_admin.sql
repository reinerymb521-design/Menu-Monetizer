-- Grant the first AudiVerse administrator through Supabase data, not client code.
-- Run this migration in the Supabase SQL Editor after confirming the email.

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