
-- Storage buckets for book assets
INSERT INTO storage.buckets (id, name, public) VALUES ('portada', 'portada', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('Libros', 'Libros', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for both buckets
CREATE POLICY "Public can view book covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'portada');

CREATE POLICY "Public can view book files"
ON storage.objects FOR SELECT
USING (bucket_id = 'Libros');

-- Admins can write (insert/update/delete) to both buckets
CREATE POLICY "Admins can upload book covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portada' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update book covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'portada' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete book covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'portada' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload book files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Libros' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update book files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'Libros' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete book files"
ON storage.objects FOR DELETE
USING (bucket_id = 'Libros' AND public.has_role(auth.uid(), 'admin'));

-- Admin management on user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin moderation on profiles (ban / VIP toggle)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admin moderation on reviews
CREATE POLICY "Admins can delete any review"
ON public.reviews FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for dashboard analytics
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book_id ON public.reading_progress (book_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);
