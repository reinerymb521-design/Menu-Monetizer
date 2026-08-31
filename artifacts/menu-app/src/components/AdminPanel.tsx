import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3, BookOpen, Users, Crown, Plus, Edit, Shield,
  Search, Upload, Loader2, FileText, Copy, Key,
  CheckCircle2, XCircle, Star,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmButton from "./ConfirmButton";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip,
} from "recharts";
import { SOCIO_CODES } from "@/lib/socioCodes";

type Tab = "dashboard" | "libros" | "usuarios" | "socios";

/* ─── SHELL ───────────────────────────────────────────────────── */
export default function AdminPanel () {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

    if (!isAdmin) {
    return (
      <div className="glass-panel p-10 text-center space-y-4">
        <Shield className="w-8 h-8 text-red-400" />
        <p className="font-semibold">Acceso restringido</p>
        <p className="text-xs text-muted-foreground">Solo los administradores pueden ver este panel.</p>
      </div>
    );
  }


  const TABS: Array<{ id: Tab; icon: typeof BarChart3; label: string; badge?: string }> = [
    { id: "dashboard", icon: BarChart3, label: "Resumen" },
    { id: "libros",    icon: BookOpen,  label: "Libros" },
    { id: "usuarios",  icon: Users,     label: "Usuarios" },
    { id: "socios",    icon: Key,       label: "Socios" },
  ];

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-base font-bold">Panel de Administración</h2>
      </div>

      {/* Tabs — scroll horizontal en móvil */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shrink-0 transition-all ${
              tab === id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "libros"    && <LibrosTab />}
        {tab === "usuarios"  && <UsuariosTab />}
        {tab === "socios"    && <SociosTab />}
      </div>
    </section>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────────── */
function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [libros, perfiles, premium, suscripciones] = await Promise.all([
        supabase.from("libros").select("id",    { count: "exact", head: true }),
        (supabase as any).from("perfiles").select("id,user_id,email,correo_electronico,es_premium,es_admin,es_administrador"),
        (supabase as any).from("perfiles").select("id",  { count: "exact", head: true }).eq("es_premium", true),
        (supabase as any).from("suscripciones").select("*"),
      ]);
      const usuarios = (perfiles.data ?? []) as any[];
      const subs = (suscripciones.data ?? []) as any[];
      const activas = subs.filter((sub) => String(sub.estado ?? sub.status ?? "").toLowerCase() === "activa" || String(sub.status ?? "").toLowerCase() === "active");
      return {
        totalLibros:   libros.count   ?? 0,
        totalUsuarios: usuarios.length,
        totalVIP:      premium.count  ?? 0,
        totalSuscripciones: activas.length,
        usuarios,
        suscripciones: subs,
      };
    },
  });

  const STAT_CARDS = [
    { label: "Libros",    value: stats?.totalLibros,   icon: BookOpen, color: "text-blue-400",   bg: "bg-blue-400/10" },
    { label: "Usuarios",  value: stats?.totalUsuarios, icon: Users,    color: "text-green-400",  bg: "bg-green-400/10" },
    { label: "VIP",       value: stats?.totalVIP,      icon: Crown,    color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Suscripciones", value: stats?.totalSuscripciones, icon: Star, color: "text-fuchsia-400", bg: "bg-fuchsia-400/10" },
  ];

  const chartData = [
    { dia: "L", v: 12 }, { dia: "M", v: 19 }, { dia: "X", v: 8 },
    { dia: "J", v: 25 }, { dia: "V", v: 31 }, { dia: "S", v: 28 }, { dia: "D", v: 22 },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-panel p-3 text-center space-y-2">
            <div className={`w-8 h-8 mx-auto rounded-full ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {isLoading ? "…" : (value ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Usuarios y suscripciones</p>
            <p className="text-[10px] text-muted-foreground">Vista rápida del estado de cada cuenta</p>
          </div>
          <Users className="w-4 h-4 text-primary" />
        </div>
        {isLoading ? (
          <div className="flex justify-center py-5"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : stats?.usuarios?.length ? (
          <div className="space-y-2">
            {stats.usuarios.slice(0, 12).map((u: any) => {
              const uid = u.user_id ?? u.id;
              const correo = u.correo_electronico ?? u.email ?? "Usuario sin correo";
              const linkedSub = stats.suscripciones.find((sub: any) =>
                sub.user_id === uid || sub.perfil_id === uid || sub.usuario_id === uid
              );
              const subscriptionState = linkedSub?.estado ?? linkedSub?.status ?? (u.es_premium || u.es_admin || u.es_administrador ? "VIP" : "Gratuito");
              return (
                <div key={uid} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/10 px-3 py-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    u.es_admin || u.es_administrador ? "bg-primary/20 text-primary" : u.es_premium ? "bg-yellow-400/20 text-yellow-400" : "bg-white/5 text-muted-foreground"
                  }`}>
                    {correo[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{correo}</p>
                    <p className="text-[10px] text-muted-foreground">{u.es_admin || u.es_administrador ? "Administrador" : u.es_premium ? "Acceso VIP" : "Plan gratuito"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold ${
                    String(subscriptionState).toLowerCase().includes("act") || subscriptionState === "VIP"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-white/5 text-muted-foreground"
                  }`}>
                    {subscriptionState}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">No hay usuarios para mostrar.</p>
        )}
      </div>

      {/* Mini gráfica */}
      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">Actividad últimos 7 días</p>
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">Demo</span>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" fontSize={9} stroke="#555" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 2" }}
              />
              <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2} fill="url(#gPrimary)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ratio VIP</p>
          <p className="text-lg font-bold text-yellow-400">
            {stats && stats.totalUsuarios > 0
              ? `${Math.round((stats.totalVIP / stats.totalUsuarios) * 100)}%`
              : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">de usuarios premium</p>
        </div>
        <div className="glass-panel p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gratuitos</p>
          <p className="text-lg font-bold text-blue-400">
            {stats ? stats.totalUsuarios - stats.totalVIP : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">usuarios sin premium</p>
        </div>
      </div>
    </div>
  );
}

/* ─── LIBROS ─────────────────────────────────────────────────── */
function LibrosTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [search, setSearch]     = useState("");

  const { data: libros = [], isLoading } = useQuery({
    queryKey: ["adminLibros", search],
    queryFn: async () => {
      let q = supabase
        .from("libros")
        .select("id, titulo, autor, url_portada, genero, es_premium, URL_PDF")
        .order("titulo")
        .limit(60);
      if (search) q = q.ilike("titulo", `%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const deleteLibro = useMutation({
    mutationFn: async (id: string) => supabase.from("libros").delete().eq("id", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminLibros"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success("Libro eliminado");
    },
  });

  const openNew   = ()      => { setEditing(null); setShowForm(true); };
  const openEdit  = (b: any)=> { setEditing(b);    setShowForm(true); };
  const closeForm = ()      => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ["adminLibros"] }); };

  return (
    <div className="space-y-3">
      {/* Barra de búsqueda + nuevo */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título..."
            className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <button
          onClick={openNew}
          className="bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && <LibroForm libro={editing} onClose={closeForm} />}

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : libros.length === 0 ? (
        <div className="glass-panel p-8 text-center text-sm text-muted-foreground">
          {search ? `Sin resultados para "${search}"` : "No hay libros aún. ¡Agrega el primero!"}
        </div>
      ) : (
        <div className="space-y-2">
          {libros.map((b: any) => (
            <div key={b.id} className="glass-panel p-3 flex items-center gap-3">
              {/* Portada */}
              <div className="w-10 h-14 rounded-md bg-white/5 overflow-hidden shrink-0 border border-white/5">
                {b.url_portada
                  ? <img src={b.url_portada} alt={b.titulo} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-muted-foreground/40" /></div>
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{b.titulo}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{b.autor || "Sin autor"}</p>
                <div className="flex gap-1.5 mt-1">
                  {b.es_premium && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full">
                      <Star className="w-2.5 h-2.5" /> VIP
                    </span>
                  )}
                  {b.URL_PDF && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full">
                      <FileText className="w-2.5 h-2.5" /> PDF
                    </span>
                  )}
                </div>
              </div>
              {/* Acciones */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(b)}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-muted-foreground hover:text-foreground"
                  title="Editar"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <ConfirmButton
                  onConfirm={() => deleteLibro.mutate(b.id)}
                  title="Eliminar libro"
                  description={`¿Borrar "${b.titulo}"? Esta acción no se puede deshacer.`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                </ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LibroForm({ libro, onClose }: { libro: any; onClose: () => void }) {
  const [form, setForm] = useState({
    titulo:      libro?.titulo      ?? "",
    autor:       libro?.autor       ?? "",
    genero:      libro?.genero      ?? "Drama y Romance",
    url_portada: libro?.url_portada ?? "",
    URL_PDF:     libro?.URL_PDF     ?? "",
    es_premium:  libro?.es_premium  ?? false,
  });
  const [saving, setSaving]   = useState(false);
  const [upCover, setUpCover] = useState(false);
  const [upPdf, setUpPdf]     = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef   = useRef<HTMLInputElement>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const uploadFile = async (file: File, bucket: string, field: "url_portada" | "URL_PDF", setUploading: (v: boolean) => void) => {
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      set(field, data.publicUrl);
      toast.success(field === "url_portada" ? "Portada subida ✓" : "PDF subido ✓");
    } else {
      toast.error(`Error al subir: ${error.message}`);
    }
    setUploading(false);
  };

  const GENEROS = ["Drama y Romance", "Ciencia Ficción y Aventura", "Terror y Suspenso", "Misterio", "Histórico", "Fantasía"];

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    const payload = { ...form };
    const client = supabase as any;
    const { error } = libro
      ? await client.from("libros").update(payload).eq("id", libro.id)
      : await client.from("libros").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(libro ? "Libro actualizado" : "Libro creado");
    onClose();
  };

  return (
    <div className="glass-panel p-4 space-y-4 border border-primary/30 rounded-xl">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        {libro ? <Edit className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
        {libro ? "Editar libro" : "Agregar nuevo libro"}
      </h3>

      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Título *</label>
          <input value={form.titulo} onChange={e => set("titulo", e.target.value)}
            placeholder="Ej. El nombre del viento"
            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-primary/60 transition" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Autor</label>
          <input value={form.autor} onChange={e => set("autor", e.target.value)}
            placeholder="Ej. Patrick Rothfuss"
            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-primary/60 transition" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Género</label>
          <select value={form.genero} onChange={e => set("genero", e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:border-primary/60 transition">
            {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Archivos */}
      <div className="grid grid-cols-2 gap-2">
        {/* Portada */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Portada</label>
          <button onClick={() => coverRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-white/20 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition">
            {upCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {form.url_portada ? "Cambiar" : "Subir imagen"}
          </button>
          {form.url_portada && (
            <img src={form.url_portada} alt="portada" className="w-full h-24 object-cover rounded-lg border border-white/10" />
          )}
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
             onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "portada", "url_portada", setUpCover)} />
        </div>

        {/* PDF */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wide">PDF del libro</label>
          <button onClick={() => pdfRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-red-500/20 text-xs text-red-400/70 hover:border-red-500/40 hover:text-red-400 transition">
            {upPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            {form.URL_PDF ? "Cambiar PDF" : "Subir PDF"}
          </button>
          {form.URL_PDF && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
              <span className="text-[10px] text-green-400">PDF listo</span>
            </div>
          )}
          <input ref={pdfRef} type="file" accept="application/pdf" className="hidden"
             onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], "Libros", "URL_PDF", setUpPdf)} />
        </div>
      </div>

      {/* VIP toggle */}
      <label className="flex items-center gap-3 p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/20 cursor-pointer select-none">
        <input type="checkbox" checked={form.es_premium} onChange={e => set("es_premium", e.target.checked)} className="accent-yellow-400 w-4 h-4" />
        <div>
          <p className="text-sm font-medium text-yellow-400">Contenido VIP</p>
          <p className="text-[10px] text-muted-foreground">Solo visible para usuarios premium</p>
        </div>
      </label>

      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition text-muted-foreground">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 rounded-lg bg-primary text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition hover:bg-primary/90">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

/* ─── USUARIOS ───────────────────────────────────────────────── */
function UsuariosTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("*");

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["adminUsuarios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("perfiles")
        .select("id, correo_electronico, es_premium, es_admin");
      return data ?? [];
    },
  });

  const updatePremium = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const res = await supabase.from("perfiles").update({ es_premium: status }).eq("id", id);
      if (res.error) await supabase.from("perfiles").update({ es_premium: status }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsuarios"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
      toast.success("Estado VIP actualizado");
    },
  });

  const filtered = usuarios.filter((u: any) => {
    const correo = (u.correo_electronico ?? "").toLowerCase();
    return correo.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-3">
      {/* Búsqueda */}
      <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg px-3">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por correo..."
          className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/60" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-8 text-center text-sm text-muted-foreground">
          {search ? `Sin resultados para "${search}"` : "No hay usuarios registrados aún."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u: any) => {
            const uid = u.id;
            const correo = u.correo_electronico ?? u.email ?? "—";
            const initial = correo[0]?.toUpperCase() ?? "?";
            return (
              <div key={uid} className="glass-panel p-3 flex items-center gap-3">
                {/* Avatar inicial */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                  u.es_admin ? "bg-primary/20 text-primary" : u.es_premium ? "bg-yellow-400/20 text-yellow-400" : "bg-white/5 text-muted-foreground"
                }`}>
                  {initial}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{correo}</p>
                  <div className="flex gap-1.5 mt-0.5">
                    {u.es_admin && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        <Shield className="w-2.5 h-2.5" /> Admin
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      u.es_premium ? "text-yellow-400 bg-yellow-400/10" : "text-gray-400 bg-gray-400/10"
                    }`}>
                      {u.es_premium ? <><Crown className="w-2.5 h-2.5" /> VIP</> : "Gratuito"}
                    </span>
                  </div>
                </div>
                {/* Acción */}
                {!u.es_admin && (
                  <button
                    onClick={() => updatePremium.mutate({ id: uid, status: !u.es_premium })}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition shrink-0 ${
                      u.es_premium
                        ? "bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20"
                        : "bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20"
                    }`}
                  >
                    {u.es_premium ? "Quitar VIP" : "Dar VIP"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── SOCIOS ─────────────────────────────────────────────────── */
function SociosTab() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const entries = Object.entries(SOCIO_CODES);

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex gap-3 p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
        <Key className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-yellow-400">Códigos de Socio Fundador</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cada código activa <strong>Premium permanente y gratuito</strong>. Compártelos solo con personas de confianza. Un código = un usuario.
          </p>
        </div>
      </div>

      {/* Lista de códigos */}
      <div className="space-y-2">
        {entries.map(([code, { nombre }], i) => (
          <div key={code} className="glass-panel p-3.5 flex items-center gap-3">
            {/* Número */}
            <div className="w-7 h-7 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-yellow-400">{i + 1}</span>
            </div>
            {/* Código */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">{nombre}</p>
              <p className="font-mono font-bold text-sm text-yellow-400 tracking-widest">{code}</p>
            </div>
            {/* Estado + copiar */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-[10px] text-green-400">
                <CheckCircle2 className="w-3 h-3" /> Activo
              </span>
              <button
                onClick={() => copyCode(code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  copied === code
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {copied === code ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === code ? "¡Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center pb-2">
        Los usuarios canjean su código en la sección VIP de la app
      </p>
    </div>
  );
}
