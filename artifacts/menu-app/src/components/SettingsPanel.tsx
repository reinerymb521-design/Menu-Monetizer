import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, type ThemeMode, type Language, type FontSize } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  X, ChevronRight, ChevronLeft, User, Palette, Languages, Bell, Shield,
  Headphones, Database, Lock, Crown, HelpCircle, Info, LogOut, Trash2,
  Moon, Sun, Monitor, Check, KeyRound, AtSign, Eye, EyeOff,
} from "lucide-react";

type View =
  | "main"
  | "cuenta"
  | "apariencia"
  | "idioma"
  | "notificaciones"
  | "privacidad"
  | "reproduccion"
  | "datos"
  | "seguridad"
  | "premium"
  | "ayuda"
  | "acerca";

interface Props {
  open: boolean;
  onClose: () => void;
  onGoToVIP?: () => void;
}

export default function SettingsPanel({ open, onClose, onGoToVIP }: Props) {
  const [view, setView] = useState<View>("main");
  const { signOut, profile, isPremium } = useAuth();

  if (!open) return null;

  const close = () => {
    setView("main");
    onClose();
  };

  const goToVIP = () => {
    if (onGoToVIP) {
      close();
      onGoToVIP();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <div className="absolute inset-0 bg-black/60" onClick={close} />
      <div className="relative ml-auto w-full max-w-md h-full bg-background border-l border-white/10 flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="glass-header sticky top-0 flex items-center justify-between px-4 py-3 z-10">
          <div className="flex items-center gap-2">
            {view !== "main" && (
              <button
                onClick={() => setView("main")}
                className="p-1 rounded-full hover:bg-white/10"
                aria-label="Volver"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-bold">{titleFor(view)}</h2>
          </div>
          <button onClick={close} className="p-1 rounded-full hover:bg-white/10" aria-label="Cerrar">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {view === "main" && (
            <MainList
              isPremium={isPremium}
              onSelect={setView}
              onSignOut={async () => {
                await signOut();
                close();
              }}
              onGoToVIP={goToVIP}
            />
          )}
          {view === "cuenta" && <CuentaSection />}
          {view === "apariencia" && <AparienciaSection />}
          {view === "idioma" && <IdiomaSection />}
          {view === "notificaciones" && <NotificacionesSection />}
          {view === "privacidad" && <PrivacidadSection />}
          {view === "reproduccion" && <ReproduccionSection />}
          {view === "datos" && <DatosSection />}
          {view === "seguridad" && <SeguridadSection />}
          {view === "premium" && <PremiumSection isPremium={isPremium} onGoToVIP={goToVIP} />}
          {view === "ayuda" && <AyudaSection />}
          {view === "acerca" && <AcercaSection />}
        </div>
      </div>
    </div>
  );
}

function titleFor(v: View): string {
  switch (v) {
    case "main": return "Opciones";
    case "cuenta": return "Cuenta";
    case "apariencia": return "Apariencia";
    case "idioma": return "Idioma";
    case "notificaciones": return "Notificaciones";
    case "privacidad": return "Privacidad";
    case "reproduccion": return "Reproducción";
    case "datos": return "Datos y almacenamiento";
    case "seguridad": return "Seguridad";
    case "premium": return "Premium";
    case "ayuda": return "Ayuda y soporte";
    case "acerca": return "Acerca de AudiVerse";
  }
}

/* ----------------------- LIST ITEM ----------------------- */
function MenuItem({
  icon: Icon, label, hint, onClick, danger, badge,
}: {
  icon: any; label: string; hint?: string; onClick?: () => void; danger?: boolean; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full glass-panel px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition text-left ${
        danger ? "text-destructive" : "text-foreground"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          danger ? "bg-destructive/15" : "bg-white/10"
        }`}
      >
        <Icon className={`w-4 h-4 ${danger ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{hint}</p>}
      </div>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-medium">
          {badge}
        </span>
      )}
      {!danger && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
    </button>
  );
}

function Toggle({
  checked, onChange,
}: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition ${checked ? "bg-primary" : "bg-white/15"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function Row({
  icon: Icon, label, hint, children,
}: { icon: any; label: string; hint?: string; children: React.ReactNode }) {
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

/* ----------------------- MAIN LIST ----------------------- */
function MainList({
  isPremium, onSelect, onSignOut, onGoToVIP,
}: { isPremium: boolean; onSelect: (v: View) => void; onSignOut: () => void; onGoToVIP: () => void }) {
  const groups: { title: string; items: { v: View; icon: any; label: string; hint: string; onClick?: () => void; badge?: string }[] }[] = [
    {
      title: "Cuenta",
      items: [
        { v: "cuenta", icon: User, label: "Información personal", hint: "Nombre, foto, biografía" },
        { v: "seguridad", icon: Lock, label: "Seguridad", hint: "Contraseña y sesión" },
        {
          v: "premium",
          icon: Crown,
          label: "Suscripción Premium",
          hint: isPremium ? "Activa — Carnet Dorado" : "Desbloquea contenido VIP",
          onClick: onGoToVIP,
          badge: isPremium ? "VIP" : undefined,
        },
      ],
    },
    {
      title: "Preferencias",
      items: [
        { v: "apariencia", icon: Palette, label: "Apariencia", hint: "Tema y tamaño de texto" },
        { v: "idioma", icon: Languages, label: "Idioma", hint: "Español" },
        { v: "notificaciones", icon: Bell, label: "Notificaciones", hint: "Push y correo" },
        { v: "privacidad", icon: Shield, label: "Privacidad", hint: "Visibilidad de tu perfil" },
        { v: "reproduccion", icon: Headphones, label: "Reproducción", hint: "Audio y velocidad" },
        { v: "datos", icon: Database, label: "Datos y almacenamiento", hint: "Caché y descargas" },
      ],
    },
    {
      title: "Información",
      items: [
        { v: "ayuda", icon: HelpCircle, label: "Ayuda y soporte", hint: "Preguntas frecuentes" },
        { v: "acerca", icon: Info, label: "Acerca de AudiVerse", hint: "Versión y términos" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.title} className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
            {g.title}
          </p>
          <div className="space-y-2">
            {g.items.map((it) => (
              <MenuItem
                key={it.v}
                icon={it.icon}
                label={it.label}
                hint={it.hint}
                badge={it.badge}
                onClick={it.onClick ?? (() => onSelect(it.v))}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="pt-2">
        <button
          onClick={onSignOut}
          className="w-full glass-panel px-4 py-3 flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 transition text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/* ----------------------- CUENTA ----------------------- */
function CuentaSection() {
  const { user, profile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const { supabase: _sb } = { supabase };

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
        <label className="block text-xs font-semibold text-muted-foreground">URL de avatar</label>
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

      <div className="pt-3">
        <button
          onClick={() =>
            toast.info(
              "Para eliminar tu cuenta, escríbenos a soporte@audiverse.app desde tu correo registrado.",
            )
          }
          className="w-full glass-panel px-4 py-3 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition text-sm font-semibold"
        >
          <Trash2 className="w-4 h-4" /> Eliminar mi cuenta
        </button>
      </div>
    </div>
  );
}

/* ----------------------- APARIENCIA ----------------------- */
function AparienciaSection() {
  const { settings, updateSetting } = useSettings();
  const themes: { v: ThemeMode; label: string; icon: any }[] = [
    { v: "dark", label: "Oscuro", icon: Moon },
    { v: "light", label: "Claro", icon: Sun },
    { v: "system", label: "Sistema", icon: Monitor },
  ];
  const sizes: { v: FontSize; label: string }[] = [
    { v: "sm", label: "Pequeño" },
    { v: "md", label: "Mediano" },
    { v: "lg", label: "Grande" },
  ];

  return (
    <div className="space-y-3">
      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Tema</p>
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

      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Tamaño de texto</p>
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

/* ----------------------- IDIOMA ----------------------- */
function IdiomaSection() {
  const { settings, updateSetting } = useSettings();
  const langs: { v: Language; label: string; flag: string }[] = [
    { v: "es", label: "Español", flag: "🇪🇸" },
    { v: "en", label: "English", flag: "🇬🇧" },
  ];
  return (
    <div className="space-y-2">
      {langs.map(({ v, label, flag }) => (
        <button
          key={v}
          onClick={() => {
            updateSetting("language", v);
            toast.success(v === "es" ? "Idioma: Español" : "Language: English");
          }}
          className={`w-full glass-panel px-4 py-3 flex items-center gap-3 transition ${
            settings.language === v ? "border-primary" : "hover:bg-white/10"
          }`}
        >
          <span className="text-xl">{flag}</span>
          <span className="flex-1 text-left text-sm font-semibold">{label}</span>
          {settings.language === v && <Check className="w-4 h-4 text-primary" />}
        </button>
      ))}
    </div>
  );
}

/* ----------------------- NOTIFICACIONES ----------------------- */
function NotificacionesSection() {
  const { settings, updateSetting } = useSettings();
  return (
    <div className="space-y-2">
      <Row icon={Bell} label="Notificaciones push" hint="Avisos en tu dispositivo">
        <Toggle checked={settings.notifPush} onChange={(v) => updateSetting("notifPush", v)} />
      </Row>
      <Row icon={AtSign} label="Por correo" hint="Resumen y novedades">
        <Toggle checked={settings.notifEmail} onChange={(v) => updateSetting("notifEmail", v)} />
      </Row>
      <Row icon={User} label="Nuevos seguidores">
        <Toggle checked={settings.notifFollows} onChange={(v) => updateSetting("notifFollows", v)} />
      </Row>
      <Row icon={Bell} label="Comentarios y reseñas">
        <Toggle checked={settings.notifComments} onChange={(v) => updateSetting("notifComments", v)} />
      </Row>
      <Row icon={Bell} label="Nuevos libros y audiolibros">
        <Toggle checked={settings.notifNewBooks} onChange={(v) => updateSetting("notifNewBooks", v)} />
      </Row>
    </div>
  );
}

/* ----------------------- PRIVACIDAD ----------------------- */
function PrivacidadSection() {
  const { settings, updateSetting } = useSettings();
  return (
    <div className="space-y-2">
      <Row icon={Eye} label="Perfil público" hint="Cualquiera puede ver tu perfil">
        <Toggle checked={settings.publicProfile} onChange={(v) => updateSetting("publicProfile", v)} />
      </Row>
      <Row icon={AtSign} label="Mostrar correo en perfil">
        <Toggle checked={settings.showEmail} onChange={(v) => updateSetting("showEmail", v)} />
      </Row>
      <Row icon={EyeOff} label="Aparecer en búsquedas">
        <Toggle checked={settings.searchable} onChange={(v) => updateSetting("searchable", v)} />
      </Row>
    </div>
  );
}

/* ----------------------- REPRODUCCIÓN ----------------------- */
function ReproduccionSection() {
  const { settings, updateSetting } = useSettings();
  return (
    <div className="space-y-2">
      <Row icon={Headphones} label="Auto-reproducción" hint="Reproduce el siguiente capítulo">
        <Toggle checked={settings.autoplay} onChange={(v) => updateSetting("autoplay", v)} />
      </Row>

      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Velocidad por defecto</p>
          <span className="text-sm text-primary font-bold">{settings.defaultSpeed.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.05}
          value={settings.defaultSpeed}
          onChange={(e) => updateSetting("defaultSpeed", Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0.5x</span><span>1x</span><span>1.5x</span><span>2x</span>
        </div>
      </div>

      <div className="glass-panel p-4 space-y-2">
        <p className="text-sm font-semibold">Calidad de audio</p>
        <div className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as const).map((q) => (
            <button
              key={q}
              onClick={() => updateSetting("audioQuality", q)}
              className={`py-2 rounded-lg border text-xs font-medium transition ${
                settings.audioQuality === q
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {q === "low" ? "Baja" : q === "medium" ? "Media" : "Alta"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------- DATOS ----------------------- */
function DatosSection() {
  const { settings, updateSetting } = useSettings();

  const clearCache = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("cache_"))
        .forEach((k) => localStorage.removeItem(k));
      toast.success("Caché eliminada");
    } catch {
      toast.error("No se pudo limpiar la caché");
    }
  };

  return (
    <div className="space-y-2">
      <Row icon={Database} label="Descargar solo con Wi-Fi">
        <Toggle checked={settings.downloadOnlyWifi} onChange={(v) => updateSetting("downloadOnlyWifi", v)} />
      </Row>
      <Row icon={Database} label="Descarga automática" hint="Libros guardados">
        <Toggle checked={settings.autoDownload} onChange={(v) => updateSetting("autoDownload", v)} />
      </Row>
      <button
        onClick={clearCache}
        className="w-full glass-panel px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition text-left"
      >
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Limpiar caché</p>
          <p className="text-[11px] text-muted-foreground">Libera espacio en tu dispositivo</p>
        </div>
      </button>
    </div>
  );
}

/* ----------------------- SEGURIDAD ----------------------- */
function SeguridadSection() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const change = async () => {
    if (pwd.length < 6) {
      toast.error("Mínimo 6 caracteres");
      return;
    }
    if (pwd !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Contraseña actualizada");
      setPwd("");
      setConfirm("");
    }
  };

  const signOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) toast.error(error.message);
    else toast.success("Cerraste sesión en todos los dispositivos");
  };

  return (
    <div className="space-y-3">
      <div className="glass-panel p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> Cambiar contraseña
        </p>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Nueva contraseña"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirmar contraseña"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary"
        />
        <button
          onClick={change}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </div>

      <button
        onClick={signOutAll}
        className="w-full glass-panel px-4 py-3 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition text-sm font-semibold"
      >
        <LogOut className="w-4 h-4" /> Cerrar sesión en todos los dispositivos
      </button>
    </div>
  );
}

/* ----------------------- PREMIUM ----------------------- */
function PremiumSection({ isPremium, onGoToVIP }: { isPremium: boolean; onGoToVIP: () => void }) {
  return (
    <div className="space-y-3">
      <div className="glass-panel p-5 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full gradient-vip">
          <Crown className="w-7 h-7 text-black" />
        </div>
        <h3 className="text-lg font-bold">
          {isPremium ? "¡Ya eres VIP!" : "Hazte VIP"}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isPremium
            ? "Disfruta de la biblioteca completa, sin anuncios y con tu insignia dorada."
            : "Desbloquea contenido exclusivo y apoya a AudiVerse."}
        </p>
        <button
          onClick={onGoToVIP}
          className="w-full py-2.5 rounded-lg btn-vip text-sm font-bold"
        >
          {isPremium ? "Ver mi suscripción" : "Ver planes"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------- AYUDA ----------------------- */
function AyudaSection() {
  const links = [
    { label: "Preguntas frecuentes", hint: "Respuestas a las dudas comunes" },
    { label: "Reportar un problema", hint: "Cuéntanos qué no funciona" },
    { label: "Contactar soporte", hint: "soporte@audiverse.app" },
    { label: "Sugerir una función", hint: "Tu opinión nos importa" },
  ];
  return (
    <div className="space-y-2">
      {links.map((l) => (
        <button
          key={l.label}
          onClick={() => toast.info("Próximamente")}
          className="w-full glass-panel px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition text-left"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{l.label}</p>
            <p className="text-[11px] text-muted-foreground">{l.hint}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

/* ----------------------- ACERCA ----------------------- */
function AcercaSection() {
  return (
    <div className="space-y-3">
      <div className="glass-panel p-5 text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full gradient-vip">
          <Headphones className="w-7 h-7 text-black" />
        </div>
        <h3 className="text-lg font-bold">AudiVerse</h3>
        <p className="text-xs text-muted-foreground">Versión 1.0.0</p>
        <p className="text-[11px] text-muted-foreground">
          Tu universo infinito de lectura y audio.
        </p>
      </div>
      {[
        "Términos de servicio",
        "Política de privacidad",
        "Licencias open source",
        "Créditos",
      ].map((label) => (
        <button
          key={label}
          onClick={() => toast.info("Próximamente")}
          className="w-full glass-panel px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition text-left"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <p className="flex-1 text-sm font-semibold">{label}</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
