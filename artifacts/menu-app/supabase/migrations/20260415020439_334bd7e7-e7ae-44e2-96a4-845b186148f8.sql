
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_user_id UUID,
  related_book_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC);

-- Trigger: notify on new follower
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  SELECT display_name INTO follower_name FROM public.profiles WHERE user_id = NEW.follower_id LIMIT 1;
  INSERT INTO public.notifications (user_id, type, title, body, related_user_id)
  VALUES (
    NEW.following_id,
    'follow',
    'Nuevo seguidor',
    COALESCE(follower_name, 'Alguien') || ' te ha seguido',
    NEW.follower_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow();

-- Trigger: notify favorites holders on new review
CREATE OR REPLACE FUNCTION public.notify_on_review_favorite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_name TEXT;
  book_title TEXT;
  fav RECORD;
BEGIN
  SELECT display_name INTO reviewer_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  SELECT title INTO book_title FROM public.books WHERE id = NEW.book_id LIMIT 1;
  
  FOR fav IN SELECT user_id FROM public.favorites WHERE book_id = NEW.book_id AND user_id != NEW.user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, related_user_id, related_book_id)
    VALUES (
      fav.user_id,
      'review_on_favorite',
      'Nueva reseña',
      COALESCE(reviewer_name, 'Alguien') || ' reseñó "' || COALESCE(book_title, 'un libro') || '"',
      NEW.user_id,
      NEW.book_id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_review_notify_favorites
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_review_favorite();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
