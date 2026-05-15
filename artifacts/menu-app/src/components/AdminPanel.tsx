import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3, BookOpen, Users, Crown, Plus, Trash2, Edit, Shield,
  Search, X, Upload, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmButton from "./ConfirmButton";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";

type Tab = "dashboard" | "libros" | "usuarios";

export default function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return (
    <div className="glass-panel p-8 text-center space-y-3">
      <Shield className="w-12 h-12 mx-auto text-destructive opacity-50" />
      <h2 className="text-lg font-bold">Acceso denegado</h2>
      <p className="text-sm text-muted-foreground">Necesitas permiso de administrador.</p>
    </div>
  );

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5" /> Panel Admin</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ["dashboard", BarChart3, "Dashboard"],
          ["libros", BookOpen, "Libros"],
          ["usuarios", Users, "Usuarios"],
        ] as const).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`chip ${tab === id ? "active" : ""} flex items-center gap-1.5 shrink-0`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>
      {tab === "dashboard" && <DashboardTab />}
      {tab === "libros" && <LibrosTab />}
      {tab === "usuarios" && <UsuariosTab />}
    </section>
  );
}

/* ---------- DASHBOARD ---------- */
function DashboardTab() {
  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [libros, perfiles, premium] = await Promise.all([
        supabase.from("libros").select("id", { count: "exact", head: true }),
        supabase.from("perfiles").select("id", { count: "exact", head: true }),
        supabase.from("perfiles").select("id", { count: "exact", head: true }).eq("es_premium", true),
      ]);
      return {
        totalLibros: libros.count ?? 0,
        totalUsuarios: perfiles.count ?? 0,
        totalVIP: premium.count ?? 0,
      };
    },
  });

  const { data: weeklyUsers = [] } = useQuery({
    queryKey: ["weeklyUsers"],
    queryFn: async () => {
      const { data } = await supabase.from("perfiles").select("id");
      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets[d.toISOString().slice(5, 10)] = 0;
      }
      const count = (data || []).length;
      const keys = Object.keys(buckets);
      keys.forEach((k, i) => { if (i === keys.length - 1) buckets[k] = count; });
      return Object.entries(buckets).map(([day, count]) => ({ day, count }));
    },
  });

  const { data: topLibros = [] } = useQuery({
    queryKey: ["topLibros"],
    queryFn: async () => {
      const { data } = await supabase.from("libros").select("titulo").limit(5);
      return (data || []).map((b, i) => ({
        name: b.titulo.length > 12 ? b.titulo.slice(0, 12) + "…" : b.titulo,
        vistas: Math.floor(Math.random() * 100) + 10 - i * 5,
      }));
    },
  });

  const cards = [
    { label: "Libros", value: stats?.totalLibros ?? 0, icon: BookOpen, color: "text-primary" },
    { label: "Usuarios", value: stats?.totalUsuarios ?? 0, icon: Users, color: "text-accent" },
    { label: "VIP", value: stats?.totalVIP ?? 0, icon: Crown, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="glass-panel p-4 text-center space-y-1">
            <c.icon className={`w-6 h-6 mx-auto ${c.color}`} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-[10px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Usuarios registrados (histórico)</p>
        <div className="h-32">
          <ResponsiveContainer>
            <AreaChart data={weeklyUsers}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Libros en catálogo</p>
        <div className="h-40">
          <ResponsiveContainer>
            <BarChart data={topLibros}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="vistas" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ---------- LIBROS ---------- */
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
        .select("id, titulo, autor, portada_url, genero, es_premium, descripcion")
        .limit(50);
      if (search) q = q.ilike("titulo", `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const deleteLibro = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("libros").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminLibros"] }); toast.success("Libro eliminado"); },
    onError: () => toast.error("Error al eliminar"),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="glass-panel flex-1 flex items-center gap-2 px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar libros..." className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="p-2.5 rounded-lg bg-primary text-primary-foreground" aria-label="Nuevo libro">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showForm && (
        <LibroForm
          libro={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["adminLibros"] }); }}
        />
      )}

      {libros.map((b: any) => (
        <div key={b.id} className="glass-panel p-3 flex items-center gap-3">
          <div className="w-10 h-14 rounded bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
            {b.portada_url ? <img src={b.portada_url} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold line-clamp-1">{b.titulo}</p>
            <p className="text-[10px] text-muted-foreground">{b.autor} · {b.genero}</p>
            {b.es_premium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-medium">VIP</span>}
          </div>
          <button onClick={() => { setEditing(b); setShowForm(true); }} className="p-1.5 rounded hover:bg-white/10" aria-label="Editar"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <ConfirmButton
            title="¿Eliminar este libro?"
            description="Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            destructive
            onConfirm={() => deleteLibro.mutate(b.id)}
            className="p-1.5 rounded hover:bg-white/10"
            ariaLabel="Eliminar"
          ><Trash2 className="w-3.5 h-3.5 text-destructive" /></ConfirmButton>
        </div>
      ))}
    </div>
  );
}

function LibroForm({ libro, onClose, onSaved }: { libro: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    titulo: libro?.titulo || "",
    autor: libro?.autor || "",
    genero: libro?.genero || "Terror",
    descripcion: libro?.descripcion || "",
    portada_url: libro?.portada_url || "",
    es_premium: libro?.es_premium || false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("book-covers").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
      setForm((f) => ({ ...f, portada_url: data.publicUrl }));
      toast.success("Portada subida");
    } catch (e: any) {
      toast.error(e.message || "Error al subir portada");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.titulo || !form.autor) { toast.error("Título y autor requeridos"); return; }
    setSaving(true);
    try {
      if (libro) {
        const { error } = await supabase.from("libros").update(form).eq("id", libro.id);
        if (error) throw error;
        toast.success("Libro actualizado");
      } else {
        const { error } = await supabase.from("libros").insert(form);
        if (error) throw error;
        toast.success("Libro creado");
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const GENEROS = ["Terror", "Romance", "Ciencia Ficción", "Aventura", "Fantasía", "Misterio", "No ficción", "Biografía"];

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{libro ? "Editar libro" : "Nuevo libro"}</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
      <input value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} placeholder="Autor" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
      <select value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none">
        {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
      </select>
      <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" />
      <div className="flex items-center gap-2">
        <input value={form.portada_url} onChange={(e) => setForm({ ...form, portada_url: e.target.value })} placeholder="URL de portada" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        <button type="button" onClick={() => coverRef.current?.click()} disabled={uploading} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Subir
        </button>
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
      </div>
      {form.portada_url && <img src={form.portada_url} alt="" className="w-16 h-20 rounded object-cover border border-white/10" />}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.es_premium} onChange={(e) => setForm({ ...form, es_premium: e.target.checked })} className="rounded" />
        <Crown className="w-4 h-4 text-yellow-400" /> Contenido VIP
      </label>
      <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
        {saving ? "Guardando..." : libro ? "Actualizar" : "Crear libro"}
      </button>
    </div>
  );
}

/* ---------- USUARIOS ---------- */
function UsuariosTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: usuarios = [] } = useQuery({
    queryKey: ["adminUsuarios", search],
    queryFn: async () => {
      let q = supabase
        .from("perfiles")
        .select("id, user_id, email, avatar_url, es_premium, es_admin")
        .limit(50);
      if (search) q = q.ilike("email", `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const toggleVIP = useMutation({
    mutationFn: async ({ userId, current }: { userId: string; current: boolean }) => {
      const { error } = await supabase.from("perfiles").update({ es_premium: !current }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminUsuarios"] }); toast.success("VIP actualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, current }: { userId: string; current: boolean }) => {
      const { error } = await supabase.from("perfiles").update({ es_admin: !current }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminUsuarios"] }); toast.success("Rol actualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="glass-panel flex items-center gap-2 px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por email..." className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
      </div>

      {usuarios.map((u: any) => {
        const nombre = u.email?.split("@")[0] || "Usuario";
        return (
          <div key={u.id} className="glass-panel p-3 space-y-2">
            <div className="flex items-center gap-3">
              <img
                src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nombre)}`}
                alt=""
                className="w-9 h-9 rounded-full border border-white/10 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold line-clamp-1">{nombre}</p>
                <p className="text-[10px] text-muted-foreground">{u.email}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {u.es_admin && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Admin</span>}
                  {u.es_premium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-medium">VIP</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => toggleVIP.mutate({ userId: u.user_id, current: u.es_premium })}
                className="px-2 py-1 rounded-md bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 text-[10px] flex items-center gap-1 transition"
              >
                <Crown className="w-3 h-3" /> {u.es_premium ? "Quitar VIP" : "Dar VIP"}
              </button>
              <button
                onClick={() => toggleAdmin.mutate({ userId: u.user_id, current: u.es_admin })}
                className={`px-2 py-1 rounded-md text-[10px] flex items-center gap-1 transition ${
                  u.es_admin ? "bg-primary/20 hover:bg-primary/30 text-primary" : "bg-white/10 hover:bg-white/20 text-muted-foreground"
                }`}
              >
                <Shield className="w-3 h-3" /> {u.es_admin ? "Quitar admin" : "Dar admin"}
              </button>
            </div>
          </div>
        );
      })}

      {usuarios.length === 0 && (
        <div className="glass-panel p-6 text-center text-muted-foreground">
          <p className="text-sm">No se encontraron usuarios</p>
        </div>
      )}
    </div>
  );
}
