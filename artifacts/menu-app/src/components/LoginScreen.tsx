import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Headphones, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL || "/"}`;
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-panel w-full max-w-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-vip mb-2">
            <Headphones className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AudiVerse</h1>
          <p className="text-muted-foreground text-sm">
            Tu universo infinito de lectura y audio
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-3 rounded-lg border border-white/10 bg-white/5 text-foreground font-medium hover:bg-white/10 transition flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? "Redirigiendo..." : "Continuar con Google"}
        </button>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/5 border border-white/10 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
          <p>
            Por seguridad, AudiVerse solo permite el inicio de sesión con tu
            cuenta de Google. No almacenamos contraseñas.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Al continuar aceptas nuestras condiciones de uso y política de
          privacidad.
        </p>
      </div>
    </div>
  );
}
