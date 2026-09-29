
-- Drop the overly permissive policy
DROP POLICY "System can insert notifications" ON public.notifications;

-- The triggers use SECURITY DEFINER so they bypass RLS.
-- No INSERT policy needed for regular users.
