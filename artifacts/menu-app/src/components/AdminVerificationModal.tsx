import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AdminVerificationModalProps = {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
};

export default function AdminVerificationModal({
  open,
  onClose,
  onVerified,
}: AdminVerificationModalProps) {
  const { user, isAdmin } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShowPassword(false);
      setVerifying(false);
    }
  }, [open]);

  if (!open) return null;

  const verifyAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) {
      toast.error("Tu sesión de Google ya no está activa.");
      return;
    }
    if (!password.trim()) {
      toast.error("Escribe la contraseña de administrador.");
      return;
    }

    setVerifying(true);
    try {
      // Primera barrera: el contexto ya validó el rol en Supabase.
      // La RPC vuelve a comprobarlo antes de comparar la contraseña.
      if (!isAdmin) {
        toast.error("No tienes permiso para entrar al panel.");
        return;
      }

      // Segunda barrera: la contraseña se compara dentro de Supabase,
      // nunca en el navegador ni contra una variable pública de Vite.
      const { data, error } = await (supabase as any).rpc("verificar_pass_admin", {
        pass: password,
      });

      if (error) throw error;
      if (data !== true) {
        toast.error("Contraseña de administrador incorrecta.");
        return;
      }

      toast.success("Acceso administrativo verificado.");
      setPassword("");
      onVerified();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo verificar el acceso administrativo.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-verification-title"
    >
      <div className="w-full max-w-sm rounded-3xl border border-primary/25 bg-[#171127] p-5 shadow-2xl shadow-black/50">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 id="admin-verification-title" className="text-base font-bold text-white">
                Verificación administrativa
              </h2>
              <p className="mt-1 text-xs text-white/50">Confirma tu identidad antes de continuar.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar verificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-white/60">
          Tu cuenta ya está autenticada con Google. Esta segunda verificación protege las herramientas de administración.
        </div>

        <form onSubmit={verifyAccess} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-white/75">Contraseña de administrador</span>
            <div className="relative">
              <input
                autoFocus
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Escribe tu contraseña"
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
              {verifying ? "Verificando…" : "Entrar al Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}