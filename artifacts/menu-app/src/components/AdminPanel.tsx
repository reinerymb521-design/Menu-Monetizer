import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3, BookOpen, Users, Crown, Plus, Trash2, Edit, Shield, Ban, Search, X,
  Upload, Star, MessageSquare, ShieldCheck, ShieldOff, UserCheck, UserX, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmButton from "./ConfirmButton";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";

type Tab = "dashboard" | "books" | "users" | "reviews";

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return !!data;
    },
    enabled: !!user,
  });

  if (checkingRole) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return (
    <div className="glass-panel p-8 text-center space-y-3">
      <Shield className="w-12 h-12 mx-auto text-destructive opacity-50" />
      <h2 className="text-lg font-bold">Acceso denegado</h2>
      <p className="text-sm text-muted-foreground">Necesitas rol de administrador.</p>
    </div>
  );

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5" /> Panel Admin</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          ["dashboard", BarChart3, "Dashboard"],
          ["books", BookOpen, "Libros"],
          ["users", Users, "Usuarios"],
          ["reviews", MessageSquare, "Reseñas"],
        ] as const).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`chip ${tab === id ? "active" : ""} flex items-center gap-1.5 shrink-0`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>
      {tab === "dashboard" && <DashboardTab />}
      {tab === "books" && <BooksTab />}
      {tab === "users" && <UsersTab />}
      {tab === "reviews" && <ReviewsTab />}
    </section>
  );
}

/* ---------- DASHBOARD ---------- */
function DashboardTab() {
  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [books, profiles, reviews, subs] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_premium", true),
      ]);
      return {
        totalBooks: books.count ?? 0,
        totalUsers: profiles.count ?? 0,
        totalReviews: reviews.count ?? 0,
        totalVIP: subs.count ?? 0,
      };
    },
  });

  const { data: weeklyUsers = [] } = useQuery({
    queryKey: ["weeklyUsers"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", since.toISOString());
      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        buckets[d.toISOString().slice(5, 10)] = 0;
      }
      (data || []).forEach((r: any) => {
        const k = r.created_at.slice(5, 10);
        if (k in buckets) buckets[k] += 1;
      });
      return Object.entries(buckets).map(([day, count]) => ({ day, count }));
    },
  });

  const { data: topBooks = [] } = useQuery({
    queryKey: ["topBooks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("title, view_count")
        .order("view_count", { ascending: false })
        .limit(5);
      return (data || []).map((b: any) => ({ name: b.title.length > 12 ? b.title.slice(0, 12) + "…" : b.title, views: b.view_count }));
    },
  });

  const cards = [
    { label: "Libros", value: stats?.totalBooks ?? 0, icon: BookOpen, color: "text-primary" },
    { label: "Usuarios", value: stats?.totalUsers ?? 0, icon: Users, color: "text-accent" },
    { label: "Reseñas", value: stats?.totalReviews ?? 0, icon: BarChart3, color: "text-green-400" },
    { label: "VIP", value: stats?.totalVIP ?? 0, icon: Crown, color: "text-yellow-400" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="glass-panel p-4 text-center space-y-1">
            <c.icon className={`w-6 h-6 mx-auto ${c.color}`} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-[10px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Nuevos usuarios (7 días)</p>
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
        <p className="text-xs font-semibold text-muted-foreground">Libros más vistos</p>
        <div className="h-40">
          <ResponsiveContainer>
            <BarChart data={topBooks}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="views" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ---------- BOOKS ---------- */
function BooksTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: books = [] } = useQuery({
    queryKey: ["adminBooks", search],
    queryFn: async () => {
      let q = supabase.from("books").select("*").order("created_at", { ascending: false }).limit(50);
      if (search) q = q.ilike("title", `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminBooks"] }); toast.success("Libro eliminado"); },
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

      {showForm && <BookForm book={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["adminBooks"] }); }} />}

      {books.map((b: any) => (
        <div key={b.id} className="glass-panel p-3 flex items-center gap-3">
          <div className="w-10 h-14 rounded bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
            {b.cover_url ? <img src={b.cover_url} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold line-clamp-1">{b.title}</p>
            <p className="text-[10px] text-muted-foreground">{b.author} · {b.genre}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {b.is_premium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-medium">VIP</span>}
              <span className="text-[9px] text-muted-foreground">{b.type}</span>
            </div>
          </div>
          <button onClick={() => { setEditing(b); setShowForm(true); }} className="p-1.5 rounded hover:bg-white/10" aria-label="Editar"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <ConfirmButton
            title="¿Eliminar este libro?"
            description="Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            destructive
            onConfirm={() => deleteBook.mutate(b.id)}
            className="p-1.5 rounded hover:bg-white/10"
            ariaLabel="Eliminar"
          ><Trash2 className="w-3.5 h-3.5 text-destructive" /></ConfirmButton>
        </div>
      ))}
    </div>
  );
}

function BookForm({ book, onClose, onSaved }: { book: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: book?.title || "",
    author: book?.author || "",
    genre: book?.genre || "Terror",
    type: book?.type || "libro",
    description: book?.description || "",
    cover_url: book?.cover_url || "",
    file_url: book?.file_url || "",
    is_premium: book?.is_premium || false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "file" | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadTo = async (bucket: "book-covers" | "book-files", file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUpload = async (kind: "cover" | "file", file: File) => {
    setUploading(kind);
    try {
      const url = await uploadTo(kind === "cover" ? "book-covers" : "book-files", file);
      setForm((f) => ({ ...f, [kind === "cover" ? "cover_url" : "file_url"]: url }));
      toast.success("Archivo subido");
    } catch (e: any) {
      toast.error(e.message || "Error al subir");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.author) {
      toast.error("Título y autor requeridos");
      return;
    }
    setSaving(true);
    try {
      if (book) {
        const { error } = await supabase.from("books").update(form).eq("id", book.id);
        if (error) throw error;
        toast.success("Libro actualizado");
      } else {
        const { error } = await supabase.from("books").insert(form);
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

  const GENRES = ["Terror", "Romance", "Ciencia Ficción", "Aventura", "Fantasía", "Misterio", "No ficción", "Biografía"];

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{book ? "Editar libro" : "Nuevo libro"}</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
      <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Autor" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
      <div className="flex gap-2">
        <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none">
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none">
          <option value="libro">Libro</option>
          <option value="audiolibro">Audiolibro</option>
        </select>
      </div>
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" rows={2} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" />

      {/* Cover upload */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="URL de portada" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
          <button type="button" onClick={() => coverRef.current?.click()} disabled={uploading === "cover"} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0">
            {uploading === "cover" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Portada
          </button>
          <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload("cover", e.target.files[0])} />
        </div>
        {form.cover_url && <img src={form.cover_url} alt="" className="w-16 h-20 rounded object-cover border border-white/10" />}
      </div>

      {/* File upload */}
      <div className="flex items-center gap-2">
        <input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="URL del archivo (PDF, MP3...)" className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading === "file"} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0">
          {uploading === "file" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Archivo
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.epub,.mp3,.m4a,.wav,audio/*,application/pdf" hidden onChange={(e) => e.target.files?.[0] && handleUpload("file", e.target.files[0])} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} className="rounded" />
        <Crown className="w-4 h-4 text-yellow-400" /> Contenido VIP
      </label>
      <button onClick={handleSave} disabled={saving} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
        {saving ? "Guardando..." : book ? "Actualizar" : "Crear libro"}
      </button>
    </div>
  );
}

/* ---------- USERS ---------- */
function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["adminUsers", search],
    queryFn: async () => {
      let q = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
      if (search) q = q.ilike("display_name", `%${search}%`);
      const { data } = await q;
      return data || [];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["adminRoles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data || [];
    },
  });

  const getRole = (uid: string) => roles.find((r: any) => r.user_id === uid)?.role || "user";

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      // Remove existing roles for this user, then insert new (single role per user UI)
      await supabase.from("user_roles").delete().eq("user_id", userId);
      if (role !== "user") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        // ensure base 'user' role exists
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "user" });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminRoles"] }); toast.success("Rol actualizado"); },
    onError: (e: any) => toast.error(e.message || "Error al cambiar rol"),
  });

  const toggleVIP = useMutation({
    mutationFn: async ({ userId, current }: { userId: string; current: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_premium: !current }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminUsers"] }); toast.success("VIP actualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleBan = useMutation({
    mutationFn: async ({ userId, current }: { userId: string; current: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_banned: !current }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminUsers"] }); toast.success("Estado actualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="glass-panel flex items-center gap-2 px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuarios..." className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
      </div>

      {users.map((u: any) => {
        const role = getRole(u.user_id);
        return (
          <div key={u.id} className="glass-panel p-3 space-y-2">
            <div className="flex items-center gap-3">
              <img
                src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.display_name || "U"}`}
                alt="" className="w-9 h-9 rounded-full border border-white/10 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold line-clamp-1">{u.display_name || "Sin nombre"}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                    role === "admin" ? "bg-primary/20 text-primary" :
                    role === "moderator" ? "bg-accent/20 text-accent" :
                    "bg-white/10 text-muted-foreground"
                  }`}>{role}</span>
                  {u.is_premium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-medium">VIP</span>}
                  {u.is_banned && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">Baneado</span>}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground shrink-0">{u.follower_count} seg.</p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={role}
                onChange={(e) => setRole.mutate({ userId: u.user_id, role: e.target.value as any })}
                className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-foreground focus:outline-none"
              >
                <option value="user">user</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
              <button
                onClick={() => toggleVIP.mutate({ userId: u.user_id, current: u.is_premium })}
                className="px-2 py-1 rounded-md bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 text-[10px] flex items-center gap-1 transition"
              >
                <Crown className="w-3 h-3" /> {u.is_premium ? "Quitar VIP" : "Dar VIP"}
              </button>
              <ConfirmButton
                title={u.is_banned ? "¿Desbanear usuario?" : "¿Banear usuario?"}
                description={u.is_banned ? "El usuario podrá volver a usar la app." : "El usuario no podrá interactuar."}
                confirmLabel={u.is_banned ? "Desbanear" : "Banear"}
                destructive={!u.is_banned}
                onConfirm={() => toggleBan.mutate({ userId: u.user_id, current: u.is_banned })}
                className={`px-2 py-1 rounded-md text-[10px] flex items-center gap-1 transition ${
                  u.is_banned ? "bg-green-400/10 hover:bg-green-400/20 text-green-400" : "bg-destructive/10 hover:bg-destructive/20 text-destructive"
                }`}
              >
                {u.is_banned ? <><UserCheck className="w-3 h-3" /> Desbanear</> : <><Ban className="w-3 h-3" /> Banear</>}
              </ConfirmButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- REVIEWS ---------- */
function ReviewsTab() {
  const qc = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["adminReviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, content, rating, created_at, user_id, book_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!data) return [];
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const bookIds = [...new Set(data.map((r) => r.book_id))];
      const [{ data: profiles }, { data: books }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
        supabase.from("books").select("id, title").in("id", bookIds),
      ]);
      return data.map((r: any) => ({
        ...r,
        profile: profiles?.find((p: any) => p.user_id === r.user_id),
        book: books?.find((b: any) => b.id === r.book_id),
      }));
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminReviews"] }); toast.success("Reseña eliminada"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  if (!reviews.length) return <p className="text-center text-sm text-muted-foreground py-8">No hay reseñas todavía</p>;

  return (
    <div className="space-y-3">
      {reviews.map((r: any) => (
        <div key={r.id} className="glass-panel p-3 space-y-1.5">
          <div className="flex items-start gap-2">
            <img
              src={r.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${r.profile?.display_name || "U"}`}
              alt="" className="w-7 h-7 rounded-full border border-white/10 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold">{r.profile?.display_name || "Usuario"}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">en "{r.book?.title || "?"}"</p>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
              ))}
            </div>
            <ConfirmButton
              title="¿Eliminar reseña?"
              description="Esta acción no se puede deshacer."
              confirmLabel="Eliminar"
              destructive
              onConfirm={() => del.mutate(r.id)}
              className="p-1 rounded hover:bg-white/10"
              ariaLabel="Eliminar"
            ><Trash2 className="w-3.5 h-3.5 text-destructive" /></ConfirmButton>
          </div>
          {r.content && <p className="text-xs text-muted-foreground line-clamp-3 pl-9">{r.content}</p>}
          <p className="text-[9px] text-muted-foreground pl-9">{new Date(r.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
