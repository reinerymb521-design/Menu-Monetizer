import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  /** PayPal Subscription Plan ID configured in your PayPal account (P-XXXXXXX) */
  planId?: string;
  /** Plan label shown to the user (mensual/anual) */
  plan: "monthly" | "yearly";
  /** Price for one-time fallback (when no planId provided) */
  price: string;
  onSuccess?: () => void;
}

/**
 * PayPal Smart Button for AudiVerse Premium subscriptions.
 * - If planId is provided, uses real PayPal Subscriptions (recurring billing).
 * - Otherwise, falls back to a single ORDERS payment for the period (one-time).
 *
 * On success: marks profile.is_premium = true and inserts a record into
 * `subscriptions` (payment_provider = 'paypal').
 */
export default function PayPalSubscribeButton({
  planId,
  plan,
  price,
  onSuccess,
}: Props) {
  const { user, profile } = useAuth();
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <div className="text-center text-xs text-destructive py-2">
        No se pudo cargar PayPal. Verifica tu Client ID.
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (profile?.is_premium) return null;

  const recordSubscription = async (
    providerSubId: string,
    periodMonths: number,
  ) => {
    if (!user) return;
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + periodMonths);

    // Update profile
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("user_id", user.id);
    if (pErr) console.error("profile update error", pErr);

    // Record subscription (payment_provider = 'paypal')
    const { error: sErr } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan,
      status: "active",
      payment_provider: "paypal",
      provider_subscription_id: providerSubId,
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
    });
    if (sErr) console.error("subscription insert error", sErr);
  };

  return (
    <div className="paypal-button-wrapper">
      {planId ? (
        // ---------- Real recurring subscription ----------
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "subscribe",
          }}
          createSubscription={(_data, actions) =>
            actions.subscription.create({ plan_id: planId })
          }
          onApprove={async (data) => {
            await recordSubscription(
              data.subscriptionID || `paypal_${Date.now()}`,
              plan === "monthly" ? 1 : 12,
            );
            toast.success("¡Bienvenido a AudiVerse VIP! 🎉");
            onSuccess?.();
          }}
          onError={(err) => {
            console.error("PayPal error", err);
            toast.error("Error al procesar el pago");
          }}
          onCancel={() => toast.info("Pago cancelado")}
        />
      ) : (
        // ---------- Fallback: one-time payment for the period ----------
        <PayPalButtons
          fundingSource={undefined}
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay",
          }}
          createOrder={(_data, actions) =>
            actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  description: `AudiVerse Premium — ${
                    plan === "monthly" ? "Mensual" : "Anual"
                  }`,
                  amount: { currency_code: "USD", value: price },
                },
              ],
            })
          }
          onApprove={async (_data, actions) => {
            const order = await actions.order?.capture();
            const orderId =
              order?.id || _data.orderID || `paypal_${Date.now()}`;
            await recordSubscription(orderId, plan === "monthly" ? 1 : 12);
            toast.success("¡Bienvenido a AudiVerse VIP! 🎉");
            onSuccess?.();
          }}
          onError={(err) => {
            console.error("PayPal error", err);
            toast.error("Error al procesar el pago");
          }}
          onCancel={() => toast.info("Pago cancelado")}
        />
      )}
    </div>
  );
}
