-- Align storage policies with the buckets already used by AudiVerse.
-- Social uploads are owner-prefixed; library uploads remain administrator-only.

INSERT INTO storage.buckets (id, name, public)
VALUES ('Social posts', 'Social posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('portada', 'portada', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('Libros', 'Libros', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "AudiVerse users upload social covers" ON storage.objects;
CREATE POLICY "AudiVerse users upload social covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'Social posts'
    AND name LIKE (auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS "AudiVerse users upload social books" ON storage.objects;
CREATE POLICY "AudiVerse users upload social books"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'Social posts'
    AND name LIKE (auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS "AudiVerse users update social covers" ON storage.objects;
CREATE POLICY "AudiVerse users update social covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'Social posts'
    AND name LIKE (auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'Social posts'
    AND name LIKE (auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS "AudiVerse users delete social covers" ON storage.objects;
CREATE POLICY "AudiVerse users delete social covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'Social posts'
    AND name LIKE (auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS "AudiVerse users update social books" ON storage.objects;
CREATE POLICY "AudiVerse users update social books"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'Social posts'
    AND name LIKE (auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'Social posts'
    AND name LIKE (auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS "AudiVerse users delete social books" ON storage.objects;
CREATE POLICY "AudiVerse users delete social books"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'Social posts'
    AND name LIKE (auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS "AudiVerse public can view social posts" ON storage.objects;
CREATE POLICY "AudiVerse public can view social posts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'Social posts');

DROP POLICY IF EXISTS "AudiVerse admins upload portada" ON storage.objects;
CREATE POLICY "AudiVerse admins upload portada"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portada' AND public.is_audiverse_admin());

DROP POLICY IF EXISTS "AudiVerse admins update portada" ON storage.objects;
CREATE POLICY "AudiVerse admins update portada"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portada' AND public.is_audiverse_admin())
  WITH CHECK (bucket_id = 'portada' AND public.is_audiverse_admin());

DROP POLICY IF EXISTS "AudiVerse admins delete portada" ON storage.objects;
CREATE POLICY "AudiVerse admins delete portada"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portada' AND public.is_audiverse_admin());

DROP POLICY IF EXISTS "AudiVerse admins upload Libros" ON storage.objects;
CREATE POLICY "AudiVerse admins upload Libros"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'Libros' AND public.is_audiverse_admin());

DROP POLICY IF EXISTS "AudiVerse admins update Libros" ON storage.objects;
CREATE POLICY "AudiVerse admins update Libros"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'Libros' AND public.is_audiverse_admin())
  WITH CHECK (bucket_id = 'Libros' AND public.is_audiverse_admin());

DROP POLICY IF EXISTS "AudiVerse admins delete Libros" ON storage.objects;
CREATE POLICY "AudiVerse admins delete Libros"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'Libros' AND public.is_audiverse_admin());

DROP POLICY IF EXISTS "AudiVerse public can view portada" ON storage.objects;
CREATE POLICY "AudiVerse public can view portada"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portada');

DROP POLICY IF EXISTS "AudiVerse public can view Libros" ON storage.objects;
CREATE POLICY "AudiVerse public can view Libros"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'Libros');