import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  planId?: string;
  plan: "monthly" | "yearly";
  price: string;
  onSuccess?: () => void;
}

export default function PayPalSubscribeButton({
  planId,
  plan,
  price,
  onSuccess,
}: Props) {
  const { user, isPremium } = useAuth();
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

  if (isPremium) return null;

  const recordSubscription = async (periodMonths: number) => {
    if (!user) return;

    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + periodMonths);

    const { error: pfErr } = await supabase
      .from("perfiles")
      .update({ es_premium: true })
      .eq("user_id", user.id);
    if (pfErr) console.warn("perfiles update:", pfErr.message);

    const { error: sErr } = await supabase.from("suscripciones").insert({
      estado: "activa",
      fecha_inicio: start.toISOString(),
      fecha_fin: end.toISOString(),
    });
    if (sErr) console.warn("suscripciones insert:", sErr.message);

    window.dispatchEvent(new Event("audiverse:profile-refresh"));
  };

  return (
    <div className="paypal-button-wrapper">
      {planId ? (
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "subscribe" }}
          createSubscription={(_data, actions) =>
            actions.subscription.create({ plan_id: planId })
          }
          onApprove={async () => {
            await recordSubscription(plan === "monthly" ? 1 : 12);
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
        <PayPalButtons
          fundingSource={undefined}
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
          createOrder={(_data, actions) =>
            actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  description: `AudiVerse Premium — ${plan === "monthly" ? "Mensual" : "Anual"}`,
                  amount: { currency_code: "USD", value: price },
                },
              ],
            })
          }
          onApprove={async (_data, actions) => {
            await actions.order?.capture();
            await recordSubscription(plan === "monthly" ? 1 : 12);
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
