
-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  payment_provider TEXT NOT NULL DEFAULT 'paddle',
  provider_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_subscriptions_user ON public.subscriptions (user_id, status);

-- Add is_banned to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;

-- Trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
