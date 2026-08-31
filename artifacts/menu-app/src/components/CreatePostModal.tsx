import { useEffect, useState, type FormEvent } from "react";
import { Globe2, Loader2, Lock, Users, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Visibility = "public" | "followers" | "private";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: string | null;
}

const visibilityOptions: Array<{
  value: Visibility;
  label: string;
  hint: string;
  icon: typeof Globe2;
}> = [
  { value: "public", label: "Pública", hint: "Aparece en Inicio", icon: Globe2 },
  { value: "followers", label: "Seguidores", hint: "Solo tus seguidores", icon: Users },
  { value: "private", label: "Privada", hint: "Solo tú", icon: Lock },
];

const db = supabase as any;
const SOCIAL_POSTS_BUCKET = "Social posts";

function safeExtension(file: File, fallback: string) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension || fallback;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
}: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setVisibility("public");
      setCoverFile(null);
      setBookFile(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUserId) {
      toast.error("Inicia sesión para publicar.");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error("El título es obligatorio.");
      return;
    }

    setIsSaving(true);
    try {
      let coverUrl: string | null = null;
      let bookPath: string | null = null;
      const uniqueId = `${Date.now()}-${crypto.randomUUID()}`;

      if (coverFile) {
        const path = `${currentUserId}/social-cover-${uniqueId}.${safeExtension(coverFile, "jpg")}`;
        const { error } = await supabase.storage.from(SOCIAL_POSTS_BUCKET).upload(path, coverFile, {
          contentType: coverFile.type,
          upsert: false,
        });
        if (error) throw error;
        coverUrl = supabase.storage.from(SOCIAL_POSTS_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      if (bookFile) {
        const path = `${currentUserId}/social-book-${uniqueId}.${safeExtension(bookFile, "pdf")}`;
        const { error } = await supabase.storage.from(SOCIAL_POSTS_BUCKET).upload(path, bookFile, {
          contentType: "application/pdf",
          upsert: false,
        });
        if (error) throw error;
        bookPath = path;
      }

      const { error } = await db.from("social_posts").insert({
        author_id: currentUserId,
        title: cleanTitle,
        description: description.trim() || null,
        cover_url: coverUrl,
        book_path: bookPath,
        visibility,
        is_official: false,
        official_label: null,
      });
      if (error) throw error;

      toast.success("Publicación creada con éxito.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo crear la publicación.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-post-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#171127] p-5 text-white shadow-2xl shadow-black/50">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/70">AudiVerse Social</p>
            <h2 id="create-post-title" className="mt-1 text-lg font-bold">Crear publicación</h2>
            <p className="mt-1 text-xs text-white/45">Comparte un libro o una recomendación con la comunidad.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/45 hover:bg-white/10 hover:text-white" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-white/75">Título</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              required
              placeholder="Ej. Mi recomendación de la semana"
              className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm outline-none placeholder:text-white/25 focus:border-fuchsia-200/60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-white/75">Descripción</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Cuenta por qué recomiendas este libro..."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-sm outline-none placeholder:text-white/25 focus:border-fuchsia-200/60"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-white/75">Visibilidad</span>
            <div className="grid grid-cols-3 gap-2">
              {visibilityOptions.map(({ value, label, hint, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisibility(value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    visibility === value
                      ? "border-fuchsia-200/60 bg-fuchsia-200/15 text-fuchsia-100"
                      : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className="mb-2 h-4 w-4" />
                  <span className="block text-[11px] font-bold">{label}</span>
                  <span className="mt-1 block text-[9px] opacity-65">{hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/[0.035] p-3 transition hover:border-fuchsia-200/50">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/50">Portada JPG/PNG</span>
              <span className="mt-2 block truncate text-xs text-fuchsia-100/75">{coverFile?.name || "Seleccionar imagen"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
              />
            </label>
            <label className="cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/[0.035] p-3 transition hover:border-fuchsia-200/50">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/50">Libro PDF</span>
              <span className="mt-2 block truncate text-xs text-fuchsia-100/75">{bookFile?.name || "Seleccionar PDF"}</span>
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(event) => setBookFile(event.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:bg-white/5 hover:text-white">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-fuchsia-200/20 py-3 text-sm font-bold text-fuchsia-100 hover:bg-fuchsia-200/30 disabled:opacity-50">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}