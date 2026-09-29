import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, type ThemeMode, type Language, type FontSize } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  X, ChevronRight, ChevronLeft, User, Palette, Languages, Bell, Shield,
  Moon, Sun, Monitor, Check, AtSign, Eye, EyeOff, Trash2, Info, FileText, Lock,
} from "lucide-react";

type View =
  | "main"
  | "personal"
  | "apariencia"
  | "idioma"
  | "notificaciones"
  | "privacidad"
  | "acerca"
  | "terminos"
  | "privacidadDoc";

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
    terminos: "Términos de uso",
    privacidadDoc: "Política de privacidad",
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
                onClick={() => setView(view === "terminos" || view === "privacidadDoc" ? "acerca" : "main")}
                className="p-1 rounded-full hover:bg-white/10"
                aria-label="Volver"
              >
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
          {view === "main"           && <MainList onSelect={setView} onSignOut={async () => { await signOut(); close(); }} />}
          {view === "personal"       && <PersonalSection />}
          {view === "apariencia"     && <AparienciaSection />}
          {view === "idioma"         && <IdiomaSection />}
          {view === "notificaciones" && <NotificacionesSection />}
          {view === "privacidad"     && <PrivacidadSection />}
          {view === "acerca"         && <AcercaSection onSelect={setView} />}
          {view === "terminos"       && <TerminosSection />}
          {view === "privacidadDoc"  && <PrivacidadDocSection />}
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
    { v: "acerca",         icon: Info,      label: "Acerca de AudiVerse",   hint: "Versión, términos y privacidad" },
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
    const { error } = await (supabase as any).from("perfiles").update({ avatar_url: avatarUrl.trim() || null })
      .eq("correo_electronico", user.email ?? "");
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Perfil actualizado"); window.dispatchEvent(new Event("audiverse:profile-refresh")); }
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
        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
      <button
        onClick={() => toast.info("Para eliminar tu cuenta, escríbenos a audiverso935@gmail.com")}
        className="w-full glass-panel px-4 py-3 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition text-sm font-semibold"
      >
        <Trash2 className="w-4 h-4" /> Eliminar mi cuenta
      </button>
    </div>
  );
}

/* ── Glass Toggle ── */
function GlassThemeSwitch() {
  const { settings, updateSetting } = useSettings();
  const isLight = settings.theme === "light";
  const isSystem = settings.theme === "system";

  const toggle = () => updateSetting("theme", isLight ? "dark" : "light");

  return (
    <div className="space-y-3">
      {/* Glass pill */}
      <div
        role="switch"
        aria-checked={isLight}
        onClick={toggle}
        className="relative w-full h-14 rounded-full cursor-pointer select-none overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.30), inset 0 -1px 2px rgba(255,255,255,0.06), 0 6px 24px rgba(0,0,0,0.25)",
        }}
      >
        {/* Track labels — se ocultan cuando el handle las cubre */}
        <span
          className={`absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold pointer-events-none transition-opacity duration-300 ${!isLight ? "opacity-0" : "opacity-100"}`}
          style={{ color: "rgba(160,180,220,0.7)" }}
        >
          <Moon className="w-3.5 h-3.5" /> Oscuro
        </span>
        <span
          className={`absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold pointer-events-none transition-opacity duration-300 ${isLight ? "opacity-0" : "opacity-100"}`}
          style={{ color: "rgba(255,210,100,0.75)" }}
        >
          <Sun className="w-3.5 h-3.5" /> Claro
        </span>

        {/* Sliding handle */}
        <div
          className="absolute top-[5px] bottom-[5px] rounded-full flex items-center justify-center gap-2 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
          style={{
            width: "calc(50% - 6px)",
            left: isLight ? "calc(50% + 3px)" : "5px",
            background: isLight
              ? "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,240,180,0.45) 100%)"
              : "linear-gradient(135deg, rgba(80,100,180,0.45) 0%, rgba(30,40,100,0.55) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: isLight
              ? "1px solid rgba(255,255,255,0.6)"
              : "1px solid rgba(100,130,255,0.35)",
            boxShadow: isLight
              ? "0 4px 16px rgba(255,200,80,0.35), inset 0 1px 2px rgba(255,255,255,0.7)"
              : "0 4px 16px rgba(40,60,160,0.4), inset 0 1px 2px rgba(255,255,255,0.15)",
          }}
        >
          {isLight ? (
            <>
              <Sun className="w-4 h-4 shrink-0" style={{ color: "#f59e0b" }} />
              <span className="text-xs font-bold" style={{ color: "#92400e" }}>Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 shrink-0" style={{ color: "#a5b4fc" }} />
              <span className="text-xs font-bold" style={{ color: "#c7d2fe" }}>Oscuro</span>
            </>
          )}
        </div>
      </div>

      {/* Sistema option */}
      <button
        onClick={() => updateSetting("theme", "system")}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition ${
          isSystem
            ? "bg-primary/20 text-primary border border-primary/40"
            : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-transparent"
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        Usar tema del sistema
        {isSystem && <Check className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

/* ── Apariencia ── */
function AparienciaSection() {
  const { settings, updateSetting } = useSettings();
  const sizes: { v: FontSize; label: string; preview: string }[] = [
    { v: "sm", label: "Pequeño", preview: "Aa" },
    { v: "md", label: "Mediano", preview: "Aa" },
    { v: "lg", label: "Grande",  preview: "Aa" },
  ];

  return (
    <div className="space-y-3">
      <div className="glass-panel p-4 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tema</p>
        <GlassThemeSwitch />
      </div>

      <div className="glass-panel p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tamaño de texto</p>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map(({ v, label, preview }) => (
            <button
              key={v}
              onClick={() => updateSetting("fontSize", v)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition ${
                settings.fontSize === v
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-transparent bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              <span className={`font-bold ${v === "sm" ? "text-base" : v === "md" ? "text-xl" : "text-2xl"}`}>{preview}</span>
              <span className="text-xs">{label}</span>
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
    { v: "es", label: "Español",   flag: "🇪🇸" },
    { v: "en", label: "English",   flag: "🇬🇧" },
    { v: "fr", label: "Français",  flag: "🇫🇷" },
    { v: "pt", label: "Português", flag: "🇧🇷" },
    { v: "de", label: "Deutsch",   flag: "🇩🇪" },
    { v: "it", label: "Italiano",  flag: "🇮🇹" },
  ];
  return (
    <div className="space-y-2">
      {langs.map(({ v, label, flag }) => (
        <button
          key={v}
          onClick={() => { updateSetting("language", v); toast.success(`Idioma: ${label}`); }}
          className={`w-full glass-panel px-4 py-3 flex items-center gap-3 transition ${settings.language === v ? "border border-primary" : "hover:bg-white/10"}`}
        >
          <span className="text-xl">{flag}</span>
          <span className="flex-1 text-left text-sm font-semibold">{label}</span>
          {settings.language === v && <Check className="w-4 h-4 text-primary" />}
        </button>
      ))}
    </div>
  );
}

/* ── Notificaciones ── */
function NotificacionesSection() {
  const { settings, updateSetting } = useSettings();
  return (
    <div className="space-y-2">
      <Row icon={Bell}   label="Notificaciones push"  hint="Avisos en tu dispositivo"><Toggle checked={settings.notifPush}     onChange={(v) => updateSetting("notifPush", v)} /></Row>
      <Row icon={AtSign} label="Por correo"           hint="Resumen y novedades">     <Toggle checked={settings.notifEmail}    onChange={(v) => updateSetting("notifEmail", v)} /></Row>
      <Row icon={User}   label="Nuevos seguidores">                                   <Toggle checked={settings.notifFollows}  onChange={(v) => updateSetting("notifFollows", v)} /></Row>
      <Row icon={Bell}   label="Comentarios y reseñas">                               <Toggle checked={settings.notifComments} onChange={(v) => updateSetting("notifComments", v)} /></Row>
      <Row icon={Bell}   label="Nuevos libros">                                       <Toggle checked={settings.notifNewBooks} onChange={(v) => updateSetting("notifNewBooks", v)} /></Row>
    </div>
  );
}

/* ── Privacidad ── */
function PrivacidadSection() {
  const { settings, updateSetting } = useSettings();
  return (
    <div className="space-y-2">
      <Row icon={Eye}    label="Perfil público"        hint="Cualquiera puede verte"><Toggle checked={settings.publicProfile} onChange={(v) => updateSetting("publicProfile", v)} /></Row>
      <Row icon={AtSign} label="Mostrar correo">                                     <Toggle checked={settings.showEmail}     onChange={(v) => updateSetting("showEmail", v)} /></Row>
      <Row icon={EyeOff} label="Aparecer en búsquedas">                              <Toggle checked={settings.searchable}    onChange={(v) => updateSetting("searchable", v)} /></Row>
    </div>
  );
}

/* ── Acerca de ── */
function AcercaSection({ onSelect }: { onSelect: (v: View) => void }) {
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

      <div className="glass-panel overflow-hidden">
        <button
          onClick={() => onSelect("terminos")}
          className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition text-left"
        >
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="flex-1 text-sm font-semibold">Términos de uso</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="h-px bg-white/5" />
        <button
          onClick={() => onSelect("privacidadDoc")}
          className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition text-left"
        >
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <span className="flex-1 text-sm font-semibold">Política de privacidad</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="h-px bg-white/5" />
        <div className="px-4 py-3.5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Soporte</span>
          <span className="text-primary text-xs">audiverso935@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

/* ── Términos de uso ── */
function TerminosSection() {
  return (
    <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">1. Aceptación de los términos</h3>
        <p>Al acceder y utilizar AudiVerse, aceptas estar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar la plataforma.</p>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">2. Uso de la plataforma</h3>
        <p>AudiVerse es una plataforma de lectura y audiolibros para uso personal y no comercial. Queda prohibido:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
          <li>Reproducir, distribuir o modificar el contenido sin autorización</li>
          <li>Usar bots o sistemas automáticos para acceder al servicio</li>
          <li>Compartir credenciales de acceso con terceros</li>
          <li>Cargar contenido ilegal, ofensivo o que infrinja derechos de autor</li>
        </ul>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">3. Contenido y propiedad intelectual</h3>
        <p>Todo el contenido disponible en AudiVerse está protegido por derechos de autor. Los libros y audiolibros son propiedad de sus respectivos autores y editoriales. AudiVerse actúa como plataforma distribuidora bajo las licencias correspondientes.</p>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">4. Cuentas de usuario</h3>
        <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. AudiVerse no se responsabiliza por el uso no autorizado de tu cuenta. Debes notificarnos inmediatamente ante cualquier brecha de seguridad.</p>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">5. Suscripción Premium</h3>
        <p>Los planes de suscripción Premium dan acceso a contenido exclusivo. Los pagos son procesados de forma segura y no son reembolsables salvo en casos previstos por la legislación aplicable.</p>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">6. Modificaciones</h3>
        <p>AudiVerse se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor al ser publicadas en la plataforma.</p>
      </div>
      <p className="text-xs text-muted-foreground text-center pb-4">Última actualización: julio 2026</p>
    </div>
  );
}

/* ── Política de privacidad ── */
function PrivacidadDocSection() {
  return (
    <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">1. Datos que recopilamos</h3>
        <p>AudiVerse recopila únicamente la información necesaria para proporcionar el servicio:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
          <li>Nombre y correo electrónico (a través de Google OAuth)</li>
          <li>Foto de perfil pública de Google</li>
          <li>Historial de lectura y preferencias dentro de la app</li>
          <li>Datos de suscripción (sin almacenar datos de pago)</li>
        </ul>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">2. Cómo usamos tus datos</h3>
        <p>Utilizamos tu información para:</p>
        <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
          <li>Autenticar tu acceso a la plataforma</li>
          <li>Personalizar tu experiencia de lectura</li>
          <li>Enviarte notificaciones sobre nuevos contenidos (si las tienes activadas)</li>
          <li>Gestionar tu suscripción Premium</li>
        </ul>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">3. Almacenamiento y seguridad</h3>
        <p>Tus datos se almacenan de forma segura en servidores de Supabase con cifrado en tránsito y en reposo. No vendemos ni compartimos tu información personal con terceros con fines comerciales.</p>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">4. Cookies y almacenamiento local</h3>
        <p>AudiVerse utiliza almacenamiento local del navegador (localStorage) para guardar tus preferencias de apariencia, idioma e historial de favoritos. No usamos cookies de seguimiento de terceros.</p>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">5. Tus derechos</h3>
        <p>Tienes derecho a acceder, corregir o eliminar tus datos en cualquier momento. Para ejercer estos derechos, contáctanos en <span className="text-primary">soporte@audiverse.app</span>.</p>
      </div>
      <div className="glass-panel p-4 space-y-3">
        <h3 className="font-bold text-foreground">6. Menores de edad</h3>
        <p>AudiVerse no está dirigido a menores de 13 años. No recopilamos conscientemente datos de menores. Si eres padre o tutor y crees que tu hijo ha proporcionado datos, contáctanos para eliminarlos.</p>
      </div>
      <p className="text-xs text-muted-foreground text-center pb-4">Última actualización: julio 2026</p>
    </div>
  );
}
