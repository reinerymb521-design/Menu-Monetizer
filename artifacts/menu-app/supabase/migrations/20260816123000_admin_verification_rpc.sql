-- Second-factor-style verification for the already authenticated admin.
-- The password is stored only as a bcrypt hash inside Supabase.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.admin_access_secrets (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_access_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_access_secrets FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.verificar_pass_admin(pass TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  IF NOT public.is_audiverse_admin() THEN
    RETURN false;
  END IF;

  SELECT password_hash
  INTO stored_hash
  FROM public.admin_access_secrets
  WHERE id = true;

  IF stored_hash IS NULL OR pass IS NULL OR length(trim(pass)) = 0 THEN
    RETURN false;
  END IF;

  RETURN extensions.crypt(pass, stored_hash) = stored_hash;
END;
$$;

REVOKE ALL ON FUNCTION public.verificar_pass_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_pass_admin(TEXT) TO authenticated;

-- Run this once in the Supabase SQL editor with a password chosen by the owner.
-- The plaintext is never stored in the database:
--
-- INSERT INTO public.admin_access_secrets (id, password_hash)
-- VALUES (true, extensions.crypt('CAMBIA_ESTA_CONTRASEÑA', extensions.gen_salt('bf')))
-- ON CONFLICT (id) DO UPDATE
-- SET password_hash = EXCLUDED.password_hash, updated_at = now();