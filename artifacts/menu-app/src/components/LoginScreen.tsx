import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Headphones, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL ?? "/";
      const redirectTo = `${window.location.origin}${base.endsWith("/") ? base : base + "/"}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo iniciar sesión con Google");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(160deg,#1e0a3c 0%,#4a1878 35%,#7c3aed 55%,#92400e 80%,#b45309 100%)",
      }}
    >
      {/* Watermark */}
      <div
        className="absolute -top-4 -left-6 select-none pointer-events-none font-black leading-none"
        style={{ fontSize: "clamp(120px,40vw,180px)", color: "rgba(255,255,255,0.04)", letterSpacing: "-0.05em" }}
        aria-hidden
      >
        AV
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl px-7 py-9 space-y-6"
        style={{
          background: "rgba(255,255,255,0.13)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)",
        }}
      >
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#7c3aed 0%,#4c1d95 100%)",
              boxShadow: "0 6px 24px rgba(124,58,237,0.6)",
            }}
          >
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">AudiVerse</h1>
            <p className="text-sm text-white/65 mt-1">
              Tu universo Infinito de lectura y audio
            </p>
          </div>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition disabled:opacity-50"
          style={{
            background: "rgba(255,255,255,0.92)",
            color: "#1f1f1f",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          {/* Google G */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? "Redirigiendo..." : "Continuar con Google"}
        </button>

        {/* Security notice */}
        <div
          className="flex items-start gap-2.5 text-xs rounded-xl p-3"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          <p className="text-white/65">
            Por seguridad, AudiVerse solo permite el inicio de sesión con tu
            cuenta de Google. No almacenamos contraseñas.
          </p>
        </div>

        <p className="text-center text-[11px] text-white/40">
          Al continuar aceptas nuestras condiciones de uso y política de
          privacidad.
        </p>
      </div>
    </div>
  );
}
