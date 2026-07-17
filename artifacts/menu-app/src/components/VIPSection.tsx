import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles, BookOpen, Shield, Star, Calendar, KeyRound, Loader2 } from "lucide-react";
import PayPalSubscribeButton from "./PayPalSubscribeButton";
import { isValidSocioCode } from "@/lib/socioCodes";
import { toast } from "sonner";

const MONTHLY_PRICE = "5.99";
const YEARLY_PRICE = "39.99";
const MONTHLY_PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_MONTHLY as string | undefined;
const YEARLY_PLAN_ID = import.meta.env.VITE_PAYPAL_PLAN_YEARLY as string | undefined;

export default function VIPSection() {
  const { user, isPremium } = useAuth();
  const qc = useQueryClient();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [codigo, setCodigo] = useState("");
  const [canjeando, setCanjeando] = useState(false);

  const canjearCodigo = async () => {
    if (!user) { toast.error("Inicia sesión primero"); return; }
    const upper = codigo.trim().toUpperCase();
    if (!isValidSocioCode(upper)) {
      toast.error("Código inválido. Verifica y vuelve a intentarlo.");
      return;
    }
    setCanjeando(true);
    /* Intenta actualizar por id primero, luego por correo_electronico */
    const { error: e1 } = await supabase
      .from("perfiles")
      .update({ es_premium: true })
      .eq("id", user.id);
    if (e1) {
      const { error: e2 } = await supabase
        .from("perfiles")
        .update({ es_premium: true })
        .eq("correo_electronico", user.email ?? "");
      if (e2) { toast.error("No se pudo activar. Contacta al administrador."); setCanjeando(false); return; }
    }
    toast.success("¡Bienvenido, Socio! Ahora tienes acceso Premium permanente 🎉");
    setCodigo("");
    setCanjeando(false);
    qc.invalidateQueries({ queryKey: ["miSuscripcion"] });
    window.dispatchEvent(new Event("audiverse:profile-refresh"));
  };

  const { data: sub } = useQuery({
    queryKey: ["miSuscripcion"],
    queryFn: async () => {
      const { data } = await supabase
        .from("suscripciones")
        .select("estado, fecha_inicio, fecha_fin")
        .eq("estado", "activa")
        .limit(1)
        .maybeSingle();
      return data ?? null;
    },
    enabled: isPremium,
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["miSuscripcion"] });
    window.dispatchEvent(new Event("audiverse:profile-refresh"));
  };

  if (isPremium) {
    return (
      <div className="space-y-4">
        <div className="glass-panel p-6 text-center space-y-3 premium-glow">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full gradient-vip">
            <Crown className="w-7 h-7 text-black" />
          </div>
          <h2 className="text-xl font-bold">¡Eres VIP! 🎉</h2>
          <p className="text-sm text-muted-foreground">
            Disfruta de todos los beneficios premium.
          </p>

          {sub && (
            <div className="glass-panel p-3 text-left space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estado</span>
                <span className="font-semibold text-green-400 capitalize">{sub.estado}</span>
              </div>
              {sub.fecha_inicio && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Inicio
                  </span>
                  <span className="font-semibold">
                    {new Date(sub.fecha_inicio).toLocaleDateString("es", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {sub.fecha_fin && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Expira
                  </span>
                  <span className="font-semibold">
                    {new Date(sub.fecha_fin).toLocaleDateString("es", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { icon: BookOpen, label: "Biblioteca completa", desc: "Acceso a libros exclusivos" },
              { icon: Shield, label: "Sin anuncios", desc: "Experiencia limpia" },
              { icon: Star, label: "Insignia dorada", desc: "Destaca en la comunidad" },
              { icon: Sparkles, label: "Perfil destacado", desc: "Apareces primero" },
            ].map((b) => (
              <div key={b.label} className="glass-panel p-3 space-y-1">
                <b.icon className="w-5 h-5 mx-auto text-yellow-400" />
                <p className="text-[10px] font-semibold">{b.label}</p>
                <p className="text-[9px] text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const planId = plan === "monthly" ? MONTHLY_PLAN_ID : YEARLY_PLAN_ID;
  const price = plan === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE;

  return (
    <div className="space-y-4">
      <div className="glass-panel p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-vip">
            <Crown className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-xl font-bold">Carnet Dorado</h2>
          <p className="text-sm text-muted-foreground">
            Desbloquea la experiencia completa de AudiVerse
          </p>
        </div>

        <div className="space-y-3 text-left">
          {[
            { icon: BookOpen, text: "Acceso a toda la biblioteca premium" },
            { icon: Shield, text: "Sin anuncios ni interrupciones" },
            { icon: Star, text: "Insignia dorada en tu perfil" },
            { icon: Sparkles, text: "Apareces destacado en la comunidad" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                <b.icon className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-sm">{b.text}</p>
            </div>
          ))}
        </div>

        {/* Plan switcher */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setPlan("monthly")}
            className={`py-3 px-3 rounded-lg border-2 text-left transition ${
              plan === "monthly" ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-white/5 hover:border-yellow-400/30"
            }`}
          >
            <p className="text-[10px] text-muted-foreground uppercase">Mensual</p>
            <p className="text-base font-bold">${MONTHLY_PRICE}</p>
            <p className="text-[10px] text-muted-foreground">por mes</p>
          </button>
          <button
            onClick={() => setPlan("yearly")}
            className={`py-3 px-3 rounded-lg border-2 text-left transition relative ${
              plan === "yearly" ? "border-yellow-400 bg-yellow-400/10" : "border-white/10 bg-white/5 hover:border-yellow-400/30"
            }`}
          >
            <span className="absolute -top-2 right-2 text-[9px] bg-yellow-400 text-black font-bold px-1.5 py-0.5 rounded-full">-33%</span>
            <p className="text-[10px] text-muted-foreground uppercase">Anual</p>
            <p className="text-base font-bold">${YEARLY_PRICE}</p>
            <p className="text-[10px] text-muted-foreground">por año</p>
          </button>
        </div>

        <div className="pt-2 space-y-2">
          {user ? (
            <PayPalSubscribeButton key={plan} planId={planId} plan={plan} price={price} onSuccess={refreshAll} />
          ) : (
            <p className="text-center text-xs text-muted-foreground py-3">Inicia sesión para suscribirte</p>
          )}
          <p className="text-[10px] text-muted-foreground text-center">
            Pago seguro procesado por PayPal · Puedes cancelar en cualquier momento
          </p>
        </div>
      </div>

      {/* ── Código de socio ── */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-semibold">¿Tienes un código de socio?</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Los socios fundadores pueden ingresar su código para activar Premium de forma permanente y gratuita.
        </p>
        <div className="flex gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="AV-SOCIO-XXXXX"
            className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm font-mono outline-none focus:border-yellow-400/60 uppercase tracking-widest"
            onKeyDown={(e) => e.key === "Enter" && canjearCodigo()}
          />
          <button
            onClick={canjearCodigo}
            disabled={canjeando || !codigo.trim()}
            className="px-4 py-2 rounded bg-yellow-500/80 hover:bg-yellow-500 text-black text-sm font-bold disabled:opacity-40 transition flex items-center gap-1.5"
          >
            {canjeando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Canjear"}
          </button>
        </div>
      </div>
    </div>
  );
}
