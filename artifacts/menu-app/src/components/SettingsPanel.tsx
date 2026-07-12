import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, type ThemeMode, type Language, type FontSize } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  X, ChevronRight, ChevronLeft, User, Palette, Languages, Bell, Shield,
  Moon, Sun, Monitor, Check, AtSign, Eye, EyeOff, Trash2, Info,
} from "lucide-react";

type View = "main" | "personal" | "apariencia" | "idioma" | "notificaciones" | "privacidad" | "acerca";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: Props) {
  const [view, setView] = useState<View>("main");
  const { signOut } = useAuth();

  if (!open) return null;

  const close = () => { setView("main"); onClose(); };

  const titles: Record<View, string> = {
    main: "Configuración",
    personal: "Información personal",
    apariencia: "Apariencia",
    idioma: "Idioma",
    notificaciones: "Notificaciones",
    privacidad: "Privacidad",
    acerca: "Acerca de AudiVerse",
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <div className="absolute inset-0 bg-black/60" onClick={close} />
      <div className="relative ml-auto w-full max-w-md h-full bg-background border-l border-white/10 flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="glass-header sticky top-0 flex items-center justify-between px-4 py-3 z-10">
          <div className="flex items-center gap-2">
            {view !== "main" && (
              <button onClick={() => setView("main")} className="p-1 rounded-full hover:bg-white/10" aria-label="Volver">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-bold">{titles[view]}</h2>
          </div>
          <button onClick={close} className="p-1 rounded-full hover:bg-white/10" aria-label="Cerrar">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {view === "main"          && <MainList onSelect={setView} onSignOut={async () => { await signOut(); close(); }} />}
          {view === "personal"      && <PersonalSection />}
          {view === "apariencia"    && <AparienciaSection />}
          {view === "idioma"        && <IdiomaSection />}
          {view === "notificaciones"&& <NotificacionesSection />}
          {view === "privacidad"    && <PrivacidadSection />}
          {view === "acerca"        && <AcercaSection />}
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */
function MenuItem({ icon: Icon, label, hint, onClick, danger }: {
  icon: any; label: string; hint?: string; onClick?: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full glass-panel px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition text-left ${danger ? "text-destructive" : "text-foreground"}`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-destructive/15" : "bg-white/10"}`}>
        <Icon className={`w-4 h-4 ${danger ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{hint}</p>}
      </div>
      {!danger && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition ${checked ? "bg-primary" : "bg-white/15"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Row({ icon: Icon, label, hint, children }: { icon: any; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ── Main list ── */
function MainList({ onSelect, onSignOut }: { onSelect: (v: View) => void; onSignOut: () => void }) {
  const items: { v: View; icon: any; label: string; hint: string }[] = [
    { v: "personal",       icon: User,      label: "Información personal",  hint: "Nombre, foto, correo" },
    { v: "apariencia",     icon: Palette,   label: "Apariencia",            hint: "Tema, fondo y texto" },
    { v: "notificaciones", icon: Bell,      label: "Notificaciones",        hint: "Push y correo" },
    { v: "privacidad",     icon: Shield,    label: "Privacidad",            hint: "Visibilidad de tu perfil" },
    { v: "idioma",         icon: Languages, label: "Idioma",                hint: "Selecciona tu idioma" },
    { v: "acerca",         icon: Info,      label: "Acerca de AudiVerse",   hint: "Versión y términos" },
  ];

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <MenuItem key={it.v} icon={it.icon} label={it.label} hint={it.hint} onClick={() => onSelect(it.v)} />
      ))}
      <div className="pt-4">
        <button
          onClick={onSignOut}
          className="w-full glass-panel px-4 py-3 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 transition text-sm font-semibold rounded-xl"
        >
          <X className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/* ── Personal ── */
function PersonalSection() {
  const { user, profile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("perfiles")
      .update({ avatar_url: avatarUrl.trim() || null })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Perfil actualizado");
      window.dispatchEvent(new Event("audiverse:profile-refresh"));
    }
  };

  return (
    <div className="space-y-3">
      <Row icon={AtSign} label="Correo" hint={user?.email ?? ""}>
        <span className="text-[10px] text-muted-foreground">Verificado</span>
      </Row>
      <div className="glass-panel p-4 space-y-3">
        <label className="block text-xs font-semibold text-muted-foreground">URL de foto de perfil</label>
        <input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          placeholder="https://..."
        />
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
      <button
        onClick={() => toast.info("Para eliminar tu cuenta, escríbenos a soporte@audiverse.app")}
        className="w-full glass-panel px-4 py-3 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition text-sm font-semibold"
      >
        <Trash2 className="w-4 h-4" /> Eliminar mi cuenta
      </button>
    </div>
  );
}

/* ── Apariencia ── */
function AparienciaSection() {
  const { settings, updateSetting } = useSettings();
  const themes: { v: ThemeMode; label: string; icon: any }[] = [
    { v: "dark",   label: "Oscuro",  icon: Moon },
    { v: "light",  label: "Claro",   icon: Sun },
    { v: "system", label: "Sistema", icon: Monitor },
  ];
  const sizes: { v: FontSize; label: string }[] = [
    { v: "sm", label: "Pequeño" },
    { v: "md", label: "Mediano" },
    { v: "lg", label: "Grande" },
  ];

  return (
    <div className="space-y-3">
      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Tema</p>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(({ v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => updateSetting("theme", v)}
              className={`flex flex-col items-center gap-1 py-3 rounded-lg border transition ${
                settings.theme === v
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">Tamaño de texto</p>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map(({ v, label }) => (
            <button
              key={v}
              onClick={() => updateSetting("fontSize", v)}
              className={`py-2.5 rounded-lg border text-xs font-medium transition ${
                settings.fontSize === v
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Idioma ── */
function IdiomaSection() {
  const { settings, updateSetting } = useSettings();
  const langs: { v: Language; label: string; flag: string }[] = [
    { v: "es", label: "Español",    flag: "🇪🇸" },
    { v: "en", label: "English",    flag: "🇬🇧" },
    { v: "fr", label: "Français",   flag: "🇫🇷" },
    { v: "pt", label: "Português",  flag: "🇧🇷" },
    { v: "de", label: "Deutsch",    flag: "🇩🇪" },
    { v: "it", label: "Italiano",   flag: "🇮🇹" },
  ];
  const names: Record<Language, string> = {
    es: "Español", en: "English", fr: "Français", pt: "Português", de: "Deutsch", it: "Italiano",
  };

  return (
    <div className="space-y-2">
      {langs.map(({ v, label, flag }) => (
        <button
          key={v}
          onClick={() => { updateSetting("language", v); toast.success(`Idioma: ${label}`); }}
          className={`w-full glass-panel px-4 py-3 flex items-center gap-3 transition ${
            settings.language === v ? "border border-primary" : "hover:bg-white/10"
          }`}
        >
          <span className="text-xl">{flag}</span>
          <span className="flex-1 text-left text-sm font-semibold">{label}</span>
          {settings.language === v && <Check className="w-4 h-4 text-primary" />}
        </button>
      ))}
      <p className="text-[10px] text-muted-foreground text-center pt-1">
        Idioma actual: {names[settings.language]}
      </p>
    </div>
  );
}

/* ── Notificaciones ── */
function NotificacionesSection() {
  const { settings, updateSetting } = useSettings();
  return (
    <div className="space-y-2">
      <Row icon={Bell}   label="Notificaciones push"    hint="Avisos en tu dispositivo">
        <Toggle checked={settings.notifPush}     onChange={(v) => updateSetting("notifPush", v)} />
      </Row>
      <Row icon={AtSign} label="Por correo"             hint="Resumen y novedades">
        <Toggle checked={settings.notifEmail}    onChange={(v) => updateSetting("notifEmail", v)} />
      </Row>
      <Row icon={User}   label="Nuevos seguidores">
        <Toggle checked={settings.notifFollows}  onChange={(v) => updateSetting("notifFollows", v)} />
      </Row>
      <Row icon={Bell}   label="Comentarios y reseñas">
        <Toggle checked={settings.notifComments} onChange={(v) => updateSetting("notifComments", v)} />
      </Row>
      <Row icon={Bell}   label="Nuevos libros">
        <Toggle checked={settings.notifNewBooks} onChange={(v) => updateSetting("notifNewBooks", v)} />
      </Row>
    </div>
  );
}

/* ── Privacidad ── */
function PrivacidadSection() {
  const { settings, updateSetting } = useSettings();
  return (
    <div className="space-y-2">
      <Row icon={Eye}    label="Perfil público"         hint="Cualquiera puede verte">
        <Toggle checked={settings.publicProfile} onChange={(v) => updateSetting("publicProfile", v)} />
      </Row>
      <Row icon={AtSign} label="Mostrar correo en perfil">
        <Toggle checked={settings.showEmail}     onChange={(v) => updateSetting("showEmail", v)} />
      </Row>
      <Row icon={EyeOff} label="Aparecer en búsquedas">
        <Toggle checked={settings.searchable}    onChange={(v) => updateSetting("searchable", v)} />
      </Row>
    </div>
  );
}

/* ── Acerca de ── */
function AcercaSection() {
  return (
    <div className="space-y-3">
      <div className="glass-panel p-5 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
          <span className="text-2xl">🎧</span>
        </div>
        <h3 className="font-bold text-foreground text-lg">AudiVerse</h3>
        <p className="text-xs text-muted-foreground">Versión 1.0.0</p>
        <p className="text-xs text-muted-foreground">Tu universo infinito de lectura y audio</p>
      </div>
      <div className="glass-panel p-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Términos de uso</span>
          <ChevronRight className="w-4 h-4" />
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex justify-between">
          <span>Política de privacidad</span>
          <ChevronRight className="w-4 h-4" />
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex justify-between">
          <span>Soporte</span>
          <span>soporte@audiverse.app</span>
        </div>
      </div>
    </div>
  );
}
