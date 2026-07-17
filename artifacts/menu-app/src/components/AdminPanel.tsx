import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3, BookOpen, Users, Crown, Plus, Trash2, Edit, Shield,
  Search, Upload, Loader2, FileText,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmButton from "./ConfirmButton";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid,
} from "recharts";

import { Copy, Key } from "lucide-react";
import { SOCIO_CODES } from "@/lib/socioCodes";

type Tab = "dashboard" | "libros" | "pdfs" | "usuarios" | "socios";

export default function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return (
    <div className="glass-panel p-8 text-center space-y-3">
      <Shield className="w-12 h-12 mx-auto text-destructive opacity-50" />
      <h2 className="text-muted-foreground">Acceso denegado</h2>
    </div>
  );

  const TABS: Array<[Tab, any, string]> = [
    ["dashboard", BarChart3, "Dashboard"],
    ["libros", BookOpen, "Audiolibros"],
    ["pdfs", FileText, "PDFs"],
    ["usuarios", Users, "Usuarios"],
    ["socios", Key, "Socios"],
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Shield className="w-5 h-5" /> Panel Admin
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`chip ${tab === id ? "active" : ""} flex items-center gap-1.5 shrink-0`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>
      {tab === "dashboard" && <DashboardTab />}
      {tab === "libros"    && <LibrosTab />}
      {tab === "pdfs"      && <PdfsTab />}
      {tab === "usuarios"  && <UsuariosTab />}
      {tab === "socios"    && <SociosTab />}
    </section>
  );
}

/* ─── DASHBOARD ──────────────────────────────────────────────── */
function DashboardTab() {
  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [libros, perfiles, premium] = await Promise.all([
        supabase.from("libros").select("id",   { count: "exact", head: true }),
        supabase.from("perfiles").select("id", { count: "exact", head: true }),
        supabase.from("perfiles").select("id", { count: "exact", head: true }).eq("es_premium", true),
      ]);
      return {
        totalLibros:   libros.count   ?? 0,
        totalUsuarios: perfiles.count ?? 0,
        totalVIP:      premium.count  ?? 0,
      };
    },
  });

  const chartData = [
    { name: "Lun", usuarios: 40, libros: 24 },
    { name: "Mar", usuarios: 30, libros: 13 },
    { name: "Mié", usuarios: 20, libros: 38 },
    { name: "Jue", usuarios: 27, libros: 39 },
    { name: "Vie", usuarios: 18, libros: 48 },
    { name: "Sáb", usuarios: 23, libros: 38 },
    { name: "Dom", usuarios: 34, libros: 43 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Libros",   v: stats?.totalLibros,   I: BookOpen },
          { l: "Usuarios", v: stats?.totalUsuarios, I: Users },
          { l: "VIP",      v: stats?.totalVIP,      I: Crown },
        ].map((c, i) => (
          <div key={i} className="glass-panel p-4 text-center">
            <c.I className="mx-auto w-6 h-6 mb-2" />
            <p className="text-2xl font-bold">{c.v ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{c.l}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-3 h-56">
        <p className="text-xs font-semibold mb-2 text-muted-foreground">Actividad semanal</p>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" fontSize={9} stroke="#888" />
            <YAxis fontSize={9} stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "none", fontSize: 11 }} />
            <Area type="monotone" dataKey="usuarios" stroke="var(--primary)" fill="url(#g1)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-panel p-3 h-56">
        <p className="text-xs font-semibold mb-2 text-muted-foreground">Distribución de contenido</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis dataKey="name" fontSize={9} stroke="#888" />
            <Tooltip cursor={{ fill: "#222" }} contentStyle={{ backgroundColor: "#1a1a1a", border: "none", fontSize: 11 }} />
            <Bar dataKey="libros" fill="#82ca9d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── LIBROS ─────────────────────────────────────────────────── */
function LibrosTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: libros = [] } = useQuery({
    queryKey: ["adminLibros", search],
    queryFn: async () => {
      let q = supabase
        .from("libros")
        .select("id, titulo, autor, url_portada, genero, es_premium, URL_PDF")
        .limit(50);
      if (search) q = q.ilike("titulo", `%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const deleteLibro = useMutation({
    mutationFn: async (id: string) => supabase.from("libros").delete().eq("id", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminLibros"] });
      toast.success("Libro eliminado");
    },
  });

  const openNew  = () => { setEditing(null); setShowForm(true); };
  const openEdit = (b: any) => { setEditing(b); setShowForm(true); };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["adminLibros"] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-black/20 rounded px-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar libro..."
            className="flex-1 bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <button onClick={openNew} className="bg-primary px-4 py-2 rounded text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      {showForm && (
        <LibroForm libro={editing} onClose={closeForm} />
      )}

      {libros.map((b: any) => (
        <div key={b.id} className="glass-panel p-3 flex items-center gap-3">
          <div className="w-10 h-14 rounded bg-white/5 overflow-hidden shrink-0">
            {b.url_portada
              ? <img src={b.url_portada} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-muted-foreground" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm line-clamp-1">{b.titulo}</p>
            <p className="text-xs text-muted-foreground">{b.autor}</p>
            <div className="flex gap-1 mt-0.5">
              {b.es_premium  && <span className="text-[10px] text-yellow-400 font-semibold">VIP</span>}
              {b.URL_PDF     && <span className="text-[10px] text-red-400">PDF</span>}
            </div>
          </div>
          <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-white/10 rounded transition">
            <Edit className="w-4 h-4" />
          </button>
          <ConfirmButton
            onConfirm={() => deleteLibro.mutate(b.id)}
            title="Eliminar"
            description="¿Borrar este libro?"
          />
        </div>
      ))}
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
  const [saving, setSaving]     = useState(false);
  const [upCover, setUpCover]   = useState(false);
  const [upPdf, setUpPdf]       = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const pdfRef   = useRef<HTMLInputElement>(null);

  const uploadFile = async (
    file: File,
    bucket: string,
    field: "url_portada" | "URL_PDF",
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setForm((f) => ({ ...f, [field]: data.publicUrl }));
      toast.success(field === "url_portada" ? "Portada subida" : "PDF subido");

    } else {
      toast.error(error.message);
    }
    setUploading(false);
  };

  const GENEROS = [
    "Drama y Romance", "Ciencia Ficción y Aventura",
    "Terror y Suspenso", "Misterio",
  ];

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return; }
    setSaving(true);
    const { error } = libro
      ? await supabase.from("libros").update(form).eq("id", libro.id)
      : await supabase.from("libros").insert(form);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(libro ? "Libro actualizado" : "Libro creado");
    onClose();
  };

  return (
    <div className="glass-panel p-4 space-y-3 border border-primary/20">
      <h3 className="font-semibold text-sm">{libro ? "Editar libro" : "Nuevo libro"}</h3>

      <input
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        placeholder="Título *"
        className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm outline-none focus:border-primary"
      />
      <input
        value={form.autor}
        onChange={(e) => setForm({ ...form, autor: e.target.value })}
        placeholder="Autor"
        className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm outline-none focus:border-primary"
      />
      <select
        value={form.genero}
        onChange={(e) => setForm({ ...form, genero: e.target.value })}
        className="w-full bg-black/30 border border-white/10 rounded p-2 text-sm outline-none focus:border-primary"
      >
        {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>

      {/* Portada */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => coverRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded border border-white/10 text-xs hover:bg-white/5 transition"
        >
          {upCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Subir portada
        </button>
        {form.url_portada && <img src={form.url_portada} className="w-8 h-11 object-cover rounded" />}
        <input
          ref={coverRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "book-covers", "url_portada", setUpCover)}
        />
      </div>

      {/* PDF */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => pdfRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition"
        >
          {upPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          Subir PDF
        </button>
        {form.URL_PDF && <span className="text-[10px] text-green-400">✓ PDF listo</span>}
        <input
          ref={pdfRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "books-pdf", "URL_PDF", setUpPdf)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.es_premium}
          onChange={(e) => setForm({ ...form, es_premium: e.target.checked })}
          className="accent-yellow-400"
        />
        Contenido VIP (solo premium)
      </label>

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2 rounded border border-white/10 text-sm hover:bg-white/5 transition">
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded bg-primary text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar
        </button>
      </div>
    </div>
  );
}

/* ─── PDFs ───────────────────────────────────────────────────── */
function PdfsTab() {
  const { data: pdfs = [] } = useQuery({
    queryKey: ["libros_pdf"],
    queryFn: async () => {
      const { data } = await supabase
        .from("libros")
        .select("id, titulo, url_pdf, genero, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Los PDFs vinculados a libros se gestionan desde la pestaña <strong>Audiolibros</strong> (botón "Subir PDF" en cada libro).
      </p>
      {pdfs.length === 0 ? (
        <div className="glass-panel p-6 text-center text-muted-foreground text-sm">
          No hay PDFs independientes aún.
        </div>
      ) : (
        pdfs.map((pdf: any) => (
          <div key={pdf.id} className="glass-panel p-3 flex items-center gap-3">
            <FileText className="w-5 h-5 text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{pdf.titulo}</p>
              <p className="text-xs text-muted-foreground">{pdf.genero}</p>
            </div>
            {pdf.url_pdf && (
              <a href={pdf.url_pdf} target="_blank" rel="noopener noreferrer" className="text-xs text-primary">
                Ver
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ─── USUARIOS ───────────────────────────────────────────────── */
function UsuariosTab() {
  const qc = useQueryClient();

  const { data: usuarios = [] } = useQuery({
    queryKey: ["adminUsuarios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("perfiles")
        .select("id, user_id, correo_electronico, es_premium, es_admin");
      return data ?? [];
    },
  });

  const updatePremium = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const res = await supabase.from("perfiles").update({ es_premium: status }).eq("id", id);
      if (res.error) await supabase.from("perfiles").update({ es_premium: status }).eq("user_id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsuarios"] });
      toast.success("Estado VIP actualizado");
    },
  });

  return (
    <div className="space-y-2">
      {usuarios.length === 0 && (
        <div className="glass-panel p-6 text-center text-muted-foreground text-sm">
          No hay usuarios registrados aún.
        </div>
      )}
      {usuarios.map((u: any) => {
        const uid = u.id ?? u.user_id;
        const correo = u.correo_electronico ?? u.email ?? "—";
        return (
          <div key={uid} className="glass-panel p-3 flex justify-between items-center gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{correo}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.es_premium ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>
                {u.es_premium ? "VIP" : "Gratuito"}{u.es_admin ? " · Admin" : ""}
              </span>
            </div>
            <button
              onClick={() => updatePremium.mutate({ id: uid, status: !u.es_premium })}
              className={`px-3 py-1.5 text-xs rounded font-medium transition ${u.es_premium ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-green-500/20 text-green-400 hover:bg-green-500/30"}`}
            >
              {u.es_premium ? "Quitar VIP" : "Dar VIP"}
            </button>
          </div>
        );
      })}
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

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Estos 5 códigos otorgan acceso <strong>Premium permanente y gratuito</strong>. Compártelos con socios de confianza. Cada código solo puede ser canjeado una vez por usuario.
        </p>
      </div>
      <div className="space-y-2">
        {Object.entries(SOCIO_CODES).map(([code, { nombre }]) => (
          <div key={code} className="glass-panel p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{nombre}</p>
              <p className="font-mono font-bold text-sm text-yellow-400 tracking-wide">{code}</p>
            </div>
            <button
              onClick={() => copyCode(code)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 text-xs hover:bg-white/5 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied === code ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        Los códigos se validan en la sección VIP de la app
      </p>
    </div>
  );
}
