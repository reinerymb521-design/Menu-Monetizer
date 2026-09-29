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

/* Gradiente dorado oscuro de fondo de tarjeta */
const cardStyle: React.CSSProperties = {
  background: "linear-gradient(160deg,#120d00 0%,#1e1600 50%,#2e2000 100%)",
  border: "1px solid rgba(212,168,50,0.3)",
  borderRadius: "1.25rem",
  boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,220,80,0.08)",
};

export default function VIPSection() {
  const { user, isPremium, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [codigo, setCodigo] = useState("");
  const [canjeando, setCanjeando] = useState(false);

  const canjearCodigo = async () => {
    if (!user) { toast.error("Inicia sesión primero"); return; }
    if (isAdmin) { toast.success("Tu cuenta de administrador ya tiene acceso VIP."); return; }
    const upper = codigo.trim().toUpperCase();
    if (!isValidSocioCode(upper)) {
      toast.error("Código inválido. Verifica y vuelve a intentarlo.");
      return;
    }
    setCanjeando(true);
      const { error: e1 } = await (supabase as any)
      .from("perfiles")
      .update({ es_premium: true })
      .eq("id", user.id);
    if (e1) {
      const { error: e2 } = await (supabase as any)
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

  /* ── Usuario ya premium ── */
  if (isPremium) {
    return (
      <div className="space-y-4 pb-6">
        <div className="p-6 text-center space-y-4" style={cardStyle}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.5)" }}
          >
            <Crown className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-xl font-bold text-yellow-400">
            {isAdmin ? "Acceso VIP de administrador" : "¡Eres VIP! 🎉"}
          </h2>
          <p className="text-sm text-white/60">
            {isAdmin ? "Tu rol administrativo desbloquea el contenido sin código ni suscripción." : "Disfruta de todos los beneficios premium."}
          </p>

          {sub && (
            <div className="rounded-xl p-3 text-left space-y-1.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,220,80,0.15)" }}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Estado</span>
                <span className="font-semibold text-green-400 capitalize">{sub.estado}</span>
              </div>
              {sub.fecha_inicio && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3" /> Inicio</span>
                  <span className="font-semibold text-white/80">
                    {new Date(sub.fecha_inicio).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
              {sub.fecha_fin && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50 flex items-center gap-1"><Calendar className="w-3 h-3" /> Expira</span>
                  <span className="font-semibold text-white/80">
                    {new Date(sub.fecha_fin).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            {[
              { icon: BookOpen, label: "Biblioteca", desc: "Libros exclusivos" },
              { icon: Shield, label: "Sin anuncios", desc: "Experiencia limpia" },
              { icon: Star, label: "Insignia dorada", desc: "Destaca" },
              { icon: Sparkles, label: "Perfil VIP", desc: "Apareces primero" },
            ].map((b) => (
              <div key={b.label} className="rounded-xl p-3 space-y-1 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,220,80,0.12)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(245,158,11,0.2)" }}>
                  <b.icon className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-[10px] font-semibold text-white/80">{b.label}</p>
                <p className="text-[9px] text-white/40">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const planId = plan === "monthly" ? MONTHLY_PLAN_ID : YEARLY_PLAN_ID;
  const price  = plan === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE;

  return (
    <div className="space-y-4 pb-6">
      {/* ── Tarjeta principal ── */}
      <div className="p-6 space-y-5" style={cardStyle}>

        {/* Crown */}
        <div className="text-center space-y-2">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg,#f59e0b 0%,#b45309 100%)", boxShadow: "0 6px 30px rgba(245,158,11,0.5)" }}
          >
            <Crown className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-2xl font-black text-white">Carnet Dorado</h2>
          <p className="text-sm text-white/55">
            Desbloquea la experiencia completa de AudiVerse
          </p>
        </div>

        {/* Beneficios */}
        <div className="space-y-3">
          {[
            { icon: BookOpen, text: "Acceso a toda la biblioteca premium" },
            { icon: Shield,   text: "Sin anuncios ni interrupciones" },
            { icon: Star,     text: "Insignia dorada en tu perfil" },
            { icon: Sparkles, text: "Apareces destacado en la comunidad" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.35),rgba(180,83,9,0.25))", border: "1px solid rgba(245,158,11,0.4)" }}
              >
                <b.icon className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-sm text-white/85">{b.text}</p>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPlan("monthly")}
            className="py-3 px-3 rounded-xl text-left transition"
            style={{
              border: plan === "monthly" ? "2px solid #f59e0b" : "2px solid rgba(255,255,255,0.1)",
              background: plan === "monthly" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
            }}
          >
            <p className="text-[10px] text-white/50 uppercase font-semibold">Mensual</p>
            <p className="text-lg font-black text-white">${MONTHLY_PRICE}</p>
            <p className="text-[10px] text-white/40">por mes</p>
          </button>
          <button
            onClick={() => setPlan("yearly")}
            className="py-3 px-3 rounded-xl text-left transition relative"
            style={{
              border: plan === "yearly" ? "2px solid #f59e0b" : "2px solid rgba(255,255,255,0.1)",
              background: plan === "yearly" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.04)",
            }}
          >
            <span className="absolute -top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "#f59e0b", color: "#000" }}>-33%</span>
            <p className="text-[10px] text-white/50 uppercase font-semibold">Anual</p>
            <p className="text-lg font-black text-white">${YEARLY_PRICE}</p>
            <p className="text-[10px] text-white/40">por año</p>
          </button>
        </div>

        {/* PayPal */}
        <div className="space-y-2">
          {user ? (
            <PayPalSubscribeButton key={plan} planId={planId} plan={plan} price={price} onSuccess={refreshAll} />
          ) : (
            <p className="text-center text-xs text-white/40 py-3">Inicia sesión para suscribirte</p>
          )}
          <p className="text-[10px] text-white/30 text-center">
            Pago seguro procesado por PayPal · Puedes cancelar en cualquier momento
          </p>
        </div>
      </div>

      {/* ── Código de socio ── */}
      <div
        className="p-4 space-y-3 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,220,80,0.15)" }}
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-semibold text-white/90">¿Tienes un código de socio?</p>
        </div>
        <p className="text-xs text-white/45">
          Los socios fundadores pueden ingresar su código para activar Premium de forma permanente y gratuita.
        </p>
        <div className="flex gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="AV-SOCIO-XXXXX"
            className="flex-1 rounded-lg px-3 py-2 text-sm font-mono outline-none uppercase tracking-widest"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
            onKeyDown={(e) => e.key === "Enter" && canjearCodigo()}
          />
          <button
            onClick={canjearCodigo}
            disabled={canjeando || !codigo.trim()}
            className="px-4 py-2 rounded-lg text-black text-sm font-black disabled:opacity-40 transition flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            {canjeando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Canjear"}
          </button>
        </div>
      </div>
    </div>
  );
}
