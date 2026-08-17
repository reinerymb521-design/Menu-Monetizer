import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Globe2,
  Heart,
  ImagePlus,
  Loader2,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  PenLine,
  Plus,
  Send,
  Share2,
  ShieldAlert,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export interface SocialPostsSectionProps {
  mode: "feed" | "profile";
  profileUserId?: string;
  profileName?: string;
  isOwner?: boolean;
  onGoToVip?: () => void;
}

type Visibility = "public" | "followers" | "private";

type SocialPost = {
  id: string;
  author_id: string | null;
  title: string;
  description: string | null;
  cover_url: string | null;
  book_path: string | null;
  visibility: Visibility;
  is_official: boolean;
  official_label: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
};

type Profile = {
  id?: string;
  user_id: string;
  email?: string | null;
  display_name: string | null;
  avatar_url: string | null;
  perfil_publico: boolean | null;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type Review = {
  id: string;
  post_id: string;
  user_id: string;
  rating: number;
  content: string | null;
  created_at: string;
};

const db = supabase as any;

const glassCard =
  "rounded-[1.35rem] border border-white/15 bg-white/[0.075] shadow-[0_16px_50px_rgba(8,10,35,0.24)] backdrop-blur-xl";
const softButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/[0.13] focus:outline-none focus:ring-2 focus:ring-fuchsia-300/60 disabled:cursor-not-allowed disabled:opacity-45";

function initials(name?: string | null) {
  return (name || "AudiVerse")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function Avatar({
  name,
  url,
  size = "md",
}: {
  name?: string | null;
  url?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base" };
  return (
    <div
      className={`${sizes[size]} shrink-0 overflow-hidden rounded-full border border-fuchsia-200/30 bg-gradient-to-br from-fuchsia-400/35 via-violet-400/25 to-cyan-300/25 text-center font-bold leading-[inherit] text-white`}
      data-testid={`avatar-${name || "user"}`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">{initials(name)}</span>
      )}
    </div>
  );
}

function VisibilityIcon({ visibility }: { visibility: Visibility }) {
  if (visibility === "private") return <Lock className="h-3.5 w-3.5" aria-hidden="true" />;
  if (visibility === "followers") return <Users className="h-3.5 w-3.5" aria-hidden="true" />;
  return <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />;
}

function starsFor(rating: number) {
  return Array.from({ length: 5 }, (_, index) => index < rating);
}

function PostCard({
  post,
  author,
  currentUserId,
  onRefresh,
}: {
  post: SocialPost;
  author?: Profile;
  currentUserId?: string;
  onRefresh: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [comment, setComment] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  const likedQuery = useQuery({
    queryKey: ["social-post-like", post.id, currentUserId],
    queryFn: async () => {
      if (!currentUserId) return false;
      const { data, error } = await db
        .from("social_post_likes")
        .select("post_id")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    enabled: Boolean(currentUserId),
  });

  const commentsQuery = useQuery({
    queryKey: ["social-post-comments", post.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("social_post_comments")
        .select("id,post_id,user_id,content,created_at")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Comment[];
    },
    enabled: showComments,
  });

  const reviewsQuery = useQuery({
    queryKey: ["social-post-reviews", post.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("social_post_reviews")
        .select("id,post_id,user_id,rating,content,created_at")
        .eq("post_id", post.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Review[];
    },
    enabled: showReviews,
  });

  const toggleLike = async () => {
    if (!currentUserId) {
      toast.error("Inicia sesión para marcar favoritos.");
      return;
    }
    setIsBusy(true);
    try {
      if (likedQuery.data) {
        const { error } = await db
          .from("social_post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("social_post_likes")
          .insert({ post_id: post.id, user_id: currentUserId });
        if (error) throw error;
      }
      await onRefresh();
      await likedQuery.refetch();
    } catch (error: any) {
      // Una policy RLS puede impedir que el usuario cree o quite su reacción.
      toast.error(error?.message || "No se pudo actualizar el Me gusta.");
    } finally {
      setIsBusy(false);
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.description || undefined, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Enlace copiado.");
      }
      if (currentUserId) {
        const { error } = await db
          .from("social_post_shares")
          .upsert(
            { post_id: post.id, user_id: currentUserId },
            { onConflict: "post_id,user_id", ignoreDuplicates: true },
          );
        if (error) throw error;
        await onRefresh();
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") toast.error("No se pudo compartir la publicación.");
    }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      toast.error("Inicia sesión para comentar.");
      return;
    }
    const content = comment.trim();
    if (!content) return;
    setIsBusy(true);
    try {
      const { error } = await db
        .from("social_post_comments")
        .insert({ post_id: post.id, user_id: currentUserId, content });
      if (error) throw error;
      setComment("");
      await onRefresh();
      await commentsQuery.refetch();
    } catch (error: any) {
      // Si la policy RLS exige ser seguidor, Supabase devolverá el bloqueo aquí.
      toast.error(error?.message || "No se pudo publicar el comentario.");
    } finally {
      setIsBusy(false);
    }
  };

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      toast.error("Inicia sesión para dejar una reseña.");
      return;
    }
    if (rating < 1) {
      toast.error("Selecciona una puntuación.");
      return;
    }
    setIsBusy(true);
    try {
      const { error } = await db.from("social_post_reviews").upsert(
        {
          post_id: post.id,
          user_id: currentUserId,
          rating,
          content: review.trim() || null,
        },
        { onConflict: "post_id,user_id" },
      );
      if (error) throw error;
      setReview("");
      setRating(0);
      await reviewsQuery.refetch();
      toast.success("Reseña guardada.");
    } catch (error: any) {
      // La policy RLS también puede limitar reseñas a contenido visible para el lector.
      toast.error(error?.message || "No se pudo guardar la reseña.");
    } finally {
      setIsBusy(false);
    }
  };

  const displayName = author?.display_name || (post.is_official ? "AudiVerse Editorial" : "Lector AudiVerse");
  const isLiked = Boolean(likedQuery.data);

  return (
    <article id={`post-${post.id}`} className={`${glassCard} overflow-hidden`} data-testid={`card-social-post-${post.id}`}>
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar name={displayName} url={author?.avatar_url} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-white" data-testid={`text-post-author-${post.id}`}>
              {displayName}
            </p>
            {post.is_official && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-300/12 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                <Check className="h-3 w-3" /> {post.official_label || "Oficial"}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
            <span>{formatDate(post.created_at)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <VisibilityIcon visibility={post.visibility} />
              {post.visibility === "followers" ? "Seguidores" : post.visibility === "private" ? "Privada" : "Pública"}
            </span>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
      </div>

      {post.cover_url && (
        <div className="relative mx-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <img src={post.cover_url} alt={`Portada de ${post.title}`} className="max-h-80 w-full object-cover" />
        </div>
      )}

      <div className="space-y-2 p-4">
        <h3 className="text-lg font-bold tracking-[-0.02em] text-white" data-testid={`text-post-title-${post.id}`}>
          {post.title}
        </h3>
        {post.description && (
          <p className="whitespace-pre-wrap text-sm leading-6 text-white/65" data-testid={`text-post-description-${post.id}`}>
            {post.description}
          </p>
        )}
        {post.book_path && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200/15 bg-fuchsia-200/[0.07] px-3 py-2 text-xs text-fuchsia-100/80">
            <FileText className="h-4 w-4" /> PDF disponible en AudiVerse
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 border-t border-white/10 px-3 py-2">
        <button type="button" onClick={toggleLike} disabled={isBusy} className={`${softButton} border-transparent bg-transparent hover:bg-white/10 ${isLiked ? "text-pink-200" : ""}`} data-testid={`button-like-post-${post.id}`}>
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          <span>{(post.like_count || 0) + (isLiked && !post.like_count ? 1 : 0)}</span>
        </button>
        <button type="button" onClick={sharePost} className={`${softButton} border-transparent bg-transparent hover:bg-white/10`} data-testid={`button-share-post-${post.id}`}>
          <Share2 className="h-4 w-4" /><span>{post.share_count || 0}</span>
        </button>
        <button type="button" onClick={() => setShowComments((value) => !value)} className={`${softButton} border-transparent bg-transparent hover:bg-white/10`} data-testid={`button-comments-post-${post.id}`}>
          <MessageCircle className="h-4 w-4" /><span>{post.comment_count || 0}</span>
          {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        <button type="button" onClick={() => setShowReviews((value) => !value)} className={`${softButton} ml-auto border-transparent bg-transparent hover:bg-white/10`} data-testid={`button-reviews-post-${post.id}`}>
          <Star className="h-4 w-4" /><span>Reseñas</span>
        </button>
      </div>

      {showComments && (
        <div className="space-y-3 border-t border-white/10 bg-black/10 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-[0.13em] text-white/60">Comentarios</h4>
            {commentsQuery.isLoading && <Loader2 className="h-4 w-4 animate-spin text-fuchsia-200" />}
          </div>
          {commentsQuery.isError ? (
            <p className="text-xs text-rose-200">No se pudieron cargar los comentarios.</p>
          ) : commentsQuery.data?.length ? (
            <div className="space-y-2">
              {commentsQuery.data.map((item) => (
                <div key={item.id} className="rounded-xl bg-white/[0.055] px-3 py-2" data-testid={`comment-${item.id}`}>
                  <div className="mb-1 flex items-center gap-2 text-[10px] text-white/40">
                    <span className="font-semibold text-fuchsia-100/75">@{item.user_id.slice(0, 7)}</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-xs leading-5 text-white/75">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40">Sé la primera persona en comentar.</p>
          )}
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={currentUserId ? "Escribe un comentario" : "Inicia sesión para comentar"}
              disabled={!currentUserId || isBusy}
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-fuchsia-200/60"
              data-testid={`input-comment-post-${post.id}`}
            />
            <button type="submit" disabled={!comment.trim() || !currentUserId || isBusy} className="rounded-xl bg-fuchsia-200/15 px-3 text-fuchsia-100 transition hover:bg-fuchsia-200/25 disabled:opacity-40" aria-label="Publicar comentario" data-testid={`button-submit-comment-${post.id}`}>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {showReviews && (
        <div className="space-y-3 border-t border-white/10 bg-black/10 p-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.13em] text-white/60">Reseñas de la comunidad</h4>
          {reviewsQuery.isLoading ? (
            <div className="h-10 animate-pulse rounded-xl bg-white/[0.06]" />
          ) : reviewsQuery.isError ? (
            <p className="text-xs text-rose-200">No se pudieron cargar las reseñas.</p>
          ) : reviewsQuery.data?.length ? (
            <div className="space-y-2">
              {reviewsQuery.data.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl bg-white/[0.055] px-3 py-2" data-testid={`review-${item.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-white/55">@{item.user_id.slice(0, 7)}</span>
                    <span className="flex gap-0.5 text-amber-200">{starsFor(item.rating).map((filled, index) => <Star key={index} className={`h-3 w-3 ${filled ? "fill-current" : "text-white/20"}`} />)}</span>
                  </div>
                  {item.content && <p className="mt-1 text-xs text-white/70">{item.content}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40">Todavía no hay reseñas.</p>
          )}
          <form onSubmit={submitReview} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-white/60">Tu valoración</span>
              <div className="flex gap-1" role="radiogroup" aria-label="Puntuación">
                {starsFor(5).map((_, index) => (
                  <button key={index} type="button" onClick={() => setRating(index + 1)} className="rounded p-0.5 text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/60" aria-label={`${index + 1} estrellas`} data-testid={`button-rating-${post.id}-${index + 1}`}>
                    <Star className={`h-4 w-4 ${index < rating ? "fill-current" : "text-white/20"}`} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              placeholder={currentUserId ? "Añade una reseña breve" : "Inicia sesión para reseñar"}
              disabled={!currentUserId || isBusy}
              rows={2}
              className="w-full resize-none rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-fuchsia-200/60"
              data-testid={`textarea-review-post-${post.id}`}
            />
            <button type="submit" disabled={!currentUserId || rating < 1 || isBusy} className="mt-2 w-full rounded-lg bg-fuchsia-200/15 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-200/25 disabled:opacity-40" data-testid={`button-submit-review-${post.id}`}>
              Guardar reseña
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function CreatePostForm({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [cover, setCover] = useState<File | null>(null);
  const [book, setBook] = useState<File | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const bookInput = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upload = async (bucket: string, file: File, prefix: string) => {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
    const path = `${userId}/${Date.now()}-${prefix}-${safeName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    return path;
  };

  const selectCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("La portada debe ser JPG o PNG.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("La portada no puede superar 8 MB.");
      return;
    }
    setCover(file);
  };

  const selectBook = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("El archivo debe ser un PDF.");
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      toast.error("El PDF no puede superar 40 MB.");
      return;
    }
    setBook(file);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Escribe un título para la publicación.");
      return;
    }
    setIsSubmitting(true);
    try {
      let coverUrl: string | null = null;
      let bookPath: string | null = null;
      if (cover) {
        const path = await upload("book-covers", cover, "cover");
        const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
        coverUrl = data.publicUrl;
      }
      if (book) bookPath = await upload("book-files", book, "book");

      const { error } = await db.from("social_posts").insert({
        author_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        cover_url: coverUrl,
        book_path: bookPath,
        visibility,
        is_official: false,
        official_label: null,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
      });
      if (error) throw error;
      setTitle("");
      setDescription("");
      setVisibility("public");
      setCover(null);
      setBook(null);
      if (coverInput.current) coverInput.current.value = "";
      if (bookInput.current) bookInput.current.value = "";
      toast.success("Publicación creada.");
      onCreated();
    } catch (error: any) {
      // Storage y social_posts pueden tener policies RLS separadas; mostramos el bloqueo concreto.
      toast.error(error?.message || "No se pudo crear la publicación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${glassCard} space-y-4 p-4`} data-testid="form-create-social-post">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-fuchsia-200/10 p-2.5 text-fuchsia-100"><PenLine className="h-5 w-5" /></div>
        <div>
          <h2 className="text-sm font-bold text-white">Comparte algo con tu comunidad</h2>
          <p className="mt-1 text-xs text-white/45">Una recomendación, una historia o una nueva escucha.</p>
        </div>
      </div>
      <div className="space-y-3">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título de la publicación" required className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-fuchsia-200/60" data-testid="input-post-title" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Añade una descripción (opcional)" rows={3} className="w-full resize-none rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-fuchsia-200/60" data-testid="textarea-post-description" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.035] px-3 py-2.5 text-xs text-white/60 transition hover:border-fuchsia-200/50 hover:text-white" data-testid="label-cover-upload">
            <ImagePlus className="h-4 w-4 text-fuchsia-200" />
            <span className="min-w-0 flex-1 truncate">{cover?.name || "Portada JPG o PNG"}</span>
            <input ref={coverInput} type="file" accept="image/jpeg,image/png" onChange={selectCover} className="sr-only" data-testid="input-post-cover" />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.035] px-3 py-2.5 text-xs text-white/60 transition hover:border-fuchsia-200/50 hover:text-white" data-testid="label-book-upload">
            <Paperclip className="h-4 w-4 text-cyan-200" />
            <span className="min-w-0 flex-1 truncate">{book?.name || "PDF opcional"}</span>
            <input ref={bookInput} type="file" accept="application/pdf,.pdf" onChange={selectBook} className="sr-only" data-testid="input-post-book" />
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs text-white/60">
            <VisibilityIcon visibility={visibility} />
            <span>Visibilidad</span>
            <select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)} className="rounded-lg border border-white/15 bg-[#211b45] px-2 py-1.5 text-xs text-white outline-none" data-testid="select-post-visibility">
              <option value="public">Pública</option>
              <option value="followers">Seguidores</option>
              <option value="private">Solo yo</option>
            </select>
          </label>
          <button type="submit" disabled={isSubmitting || !title.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-200 to-violet-200 px-4 py-2.5 text-xs font-bold text-[#24163f] transition hover:brightness-105 disabled:opacity-45" data-testid="button-create-post">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Publicar
          </button>
        </div>
      </div>
    </form>
  );
}

export default function SocialPostsSection({
  mode,
  profileUserId,
  profileName,
  isOwner,
  onGoToVip,
}: SocialPostsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetId = mode === "profile" ? profileUserId || user?.id : undefined;
  const owner = mode === "profile" && Boolean(isOwner ?? (user?.id && targetId === user.id));

  const profileQuery = useQuery({
    queryKey: ["social-profile", targetId],
    queryFn: async () => {
      const { data, error } = await db
        .from("perfiles")
        .select("id,user_id,email,avatar_url,perfil_publico")
        .or(`user_id.eq.${targetId},id.eq.${targetId}`)
        .maybeSingle();
      if (error) throw error;
      return (data || null) as Profile | null;
    },
    enabled: mode === "profile" && Boolean(targetId),
  });

  const isPrivate = mode === "profile" && profileQuery.data?.perfil_publico === false;

  const accessQuery = useQuery({
    queryKey: ["social-access-request", user?.id, targetId],
    queryFn: async () => {
      const { data, error } = await db
        .from("social_access_requests")
        .select("status")
        .eq("requester_id", user?.id)
        .eq("target_id", targetId)
        .maybeSingle();
      if (error) throw error;
      return (data?.status as string | undefined) || null;
    },
    enabled: Boolean(user?.id && targetId && isPrivate && !owner),
  });

  const canReadPosts =
    mode === "feed" ||
    owner ||
    !isPrivate ||
    accessQuery.data === "accepted";

  const postsQuery = useQuery({
    queryKey: ["social-posts", mode, targetId, canReadPosts],
    queryFn: async () => {
      let request = db
        .from("social_posts")
        .select("id,author_id,title,description,cover_url,book_path,visibility,is_official,official_label,like_count,comment_count,share_count,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (mode === "profile" && targetId) {
        request = request.eq("author_id", targetId);
      } else {
        request = request.or("visibility.eq.public,is_official.eq.true");
      }
      const { data, error } = await request;
      if (error) throw error;
      const posts = (data || []) as SocialPost[];
      const authorIds = [...new Set(posts.map((post) => post.author_id).filter(Boolean))] as string[];
      if (!authorIds.length) return { posts, authors: [] as Profile[] };
      const { data: authors, error: authorError } = await db
        .from("perfiles")
        .select("id,user_id,email,avatar_url,perfil_publico")
        .or(`user_id.in.(${authorIds.join(",")}),id.in.(${authorIds.join(",")})`);
      if (authorError) throw authorError;
      return { posts, authors: (authors || []) as Profile[] };
    },
    enabled: canReadPosts,
  });

  const followQuery = useQuery({
    queryKey: ["social-follow", user?.id, targetId],
    queryFn: async () => {
      if (!user?.id || !targetId) return false;
      const { data, error } = await db
        .from("followers")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", targetId)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    enabled: mode === "profile" && Boolean(user?.id && targetId && !owner),
  });

  const incomingRequestsQuery = useQuery({
    queryKey: ["social-incoming-access-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("social_access_requests")
        .select("id,requester_id,status,created_at")
        .eq("target_id", user?.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(owner && user?.id),
  });

  const answerAccessRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await db
        .from("social_access_requests")
        .update({ status })
        .eq("id", id)
        .eq("target_id", user?.id);
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await incomingRequestsQuery.refetch();
      toast.success(variables.status === "accepted" ? "Solicitud aceptada." : "Solicitud rechazada.");
    },
    onError: (error: any) => {
      toast.error(error?.message || "No se pudo responder la solicitud.");
    },
  });

  const refreshSocial = async () => {
    await queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    await queryClient.invalidateQueries({ queryKey: ["social-post-like"] });
  };

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user?.id || !targetId) throw new Error("Necesitas una sesión activa.");
      if (followQuery.data) {
        const { error } = await db.from("followers").delete().eq("follower_id", user.id).eq("following_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await db.from("followers").insert({ follower_id: user.id, following_id: targetId });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["social-follow", user?.id, targetId] });
      toast.success(followQuery.data ? "Has dejado de seguir este perfil." : "Ahora sigues este perfil.");
    },
    onError: (error: any) => {
      // La policy RLS debe permitir que un usuario gestione su propia relación de seguimiento.
      toast.error(error?.message || "No se pudo actualizar la suscripción.");
    },
  });

  const requestAccess = useMutation({
    mutationFn: async () => {
      if (!user?.id || !targetId) throw new Error("Necesitas una sesión activa.");
      const { error } = await db.from("social_access_requests").upsert(
        { requester_id: user.id, target_id: targetId, status: "pending" },
        { onConflict: "requester_id,target_id" },
      );
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["social-access-request", user?.id, targetId] });
      toast.success("Solicitud enviada.");
    },
    onError: (error: any) => {
      // Una policy RLS puede exigir que la solicitud solo la cree el propio requester.
      toast.error(error?.message || "No se pudo solicitar acceso.");
    },
  });

  const authorsById = useMemo(() => {
    const map = new Map<string, Profile>();
    (postsQuery.data?.authors || []).forEach((author) => map.set(author.user_id, author));
    if (profileQuery.data && targetId) map.set(targetId, profileQuery.data);
    return map;
  }, [postsQuery.data?.authors, profileQuery.data, targetId]);

  const profileDisplayName =
    profileName ||
    profileQuery.data?.display_name ||
    profileQuery.data?.email?.split("@")[0] ||
    "Perfil AudiVerse";
  const title = mode === "profile" ? profileDisplayName : "Pulso de AudiVerse";
  const subtitle =
    mode === "profile"
      ? isPrivate && !owner
        ? "Este perfil comparte sus historias con permiso."
        : owner
          ? "Tu rincón para recomendar lecturas y sonidos."
          : "Publicaciones, recomendaciones y nuevas voces."
      : "Publicaciones oficiales y libros compartidos por la comunidad.";

  if (mode === "profile" && profileQuery.isLoading) {
    return (
      <section className="space-y-4" aria-label="Cargando perfil" data-testid="status-profile-loading">
        <div className={`${glassCard} h-28 animate-pulse bg-white/[0.04]`} />
        <div className={`${glassCard} h-72 animate-pulse bg-white/[0.04]`} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5 pb-24" data-testid={`social-posts-section-${mode}`}>
      <header className="relative overflow-hidden rounded-[1.6rem] border border-white/15 bg-gradient-to-br from-fuchsia-300/15 via-violet-300/[0.08] to-cyan-200/10 p-5 shadow-[0_18px_60px_rgba(12,10,45,0.28)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-fuchsia-200/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          {mode === "profile" ? <Avatar name={title} url={profileQuery.data?.avatar_url} size="lg" /> : <div className="rounded-2xl bg-cyan-200/12 p-3 text-cyan-100"><BookOpen className="h-7 w-7" /></div>}
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-100/65">AudiVerse Social</p>
            <h1 className="text-2xl font-black tracking-[-0.04em] text-white" data-testid="text-social-title">{title}</h1>
            <p className="mt-1 max-w-lg text-xs leading-5 text-white/55" data-testid="text-social-subtitle">{subtitle}</p>
          </div>
        </div>
        {mode === "profile" && !owner && user?.id && targetId && (
          <div className="relative mt-4 flex flex-wrap gap-2">
            {!isPrivate && (
              <button type="button" onClick={() => toggleFollow.mutate()} disabled={toggleFollow.isPending} className={`${softButton} ${followQuery.data ? "border-fuchsia-200/35 bg-fuchsia-200/15 text-fuchsia-100" : ""}`} data-testid="button-follow-profile">
                {toggleFollow.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : followQuery.data ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {followQuery.data ? "Suscrito" : "Suscribirse"}
              </button>
            )}
            {isPrivate && (
              <button type="button" onClick={() => requestAccess.mutate()} disabled={requestAccess.isPending || accessQuery.data === "pending"} className={`${softButton} border-amber-200/25 text-amber-100`} data-testid="button-request-profile-access">
                {requestAccess.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : accessQuery.data === "pending" ? <Clock3 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                {accessQuery.data === "pending" ? "Solicitud pendiente" : "Solicitar acceso"}
              </button>
            )}
          </div>
        )}
      </header>

      {mode === "profile" && owner && user?.id && <CreatePostForm userId={user.id} onCreated={refreshSocial} />}

      {mode === "profile" && owner && incomingRequestsQuery.data?.length ? (
        <div className={`${glassCard} space-y-3 p-4`} data-testid="panel-access-requests">
          <div>
            <h2 className="text-sm font-bold text-white">Solicitudes de acceso</h2>
            <p className="mt-1 text-xs text-white/45">Decide quién puede ver tus publicaciones para seguidores.</p>
          </div>
          <div className="space-y-2">
            {incomingRequestsQuery.data.map((request: { id: string; requester_id: string }) => (
              <div key={request.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <Avatar name={`Lector ${request.requester_id.slice(0, 6)}`} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white">Solicitud de lector</p>
                  <p className="truncate text-[10px] text-white/40">{request.requester_id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => answerAccessRequest.mutate({ id: request.id, status: "accepted" })}
                  disabled={answerAccessRequest.isPending}
                  className="rounded-lg bg-emerald-300/15 p-2 text-emerald-100 hover:bg-emerald-300/25 disabled:opacity-40"
                  aria-label="Aceptar solicitud"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => answerAccessRequest.mutate({ id: request.id, status: "rejected" })}
                  disabled={answerAccessRequest.isPending}
                  className="rounded-lg bg-rose-300/15 px-2.5 py-2 text-[10px] font-semibold text-rose-100 hover:bg-rose-300/25 disabled:opacity-40"
                >
                  Rechazar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "profile" && isPrivate && !owner ? (
        <div className={`${glassCard} p-8 text-center`} data-testid="empty-private-profile">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-200/10 text-amber-100"><Lock className="h-7 w-7" /></div>
          <h2 className="text-base font-bold text-white">Perfil privado</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/50">Solicita acceso para ver las publicaciones de {title}.</p>
        </div>
      ) : postsQuery.isLoading ? (
        <div className="space-y-4" aria-label="Cargando publicaciones" data-testid="status-posts-loading">
          {[1, 2].map((item) => <div key={item} className={`${glassCard} h-72 animate-pulse bg-white/[0.04]`} />)}
        </div>
      ) : postsQuery.isError ? (
        <div className={`${glassCard} p-7 text-center`} data-testid="status-posts-error">
          <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-rose-200" />
          <p className="text-sm font-semibold text-white">No pudimos cargar las publicaciones.</p>
          <p className="mt-1 text-xs text-white/45">Comprueba tu conexión e inténtalo de nuevo.</p>
          <button type="button" onClick={() => postsQuery.refetch()} className={`${softButton} mt-4`} data-testid="button-retry-posts">Reintentar</button>
        </div>
      ) : !postsQuery.data?.posts.length ? (
        <div className={`${glassCard} p-8 text-center`} data-testid="empty-social-posts">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-200/10 text-fuchsia-100"><MessageCircle className="h-7 w-7" /></div>
          <h2 className="text-base font-bold text-white">{mode === "profile" ? "Todavía no hay publicaciones" : "El pulso está tranquilo"}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/45">{owner ? "Publica una recomendación para comenzar tu historia social." : "Vuelve pronto para descubrir nuevas publicaciones y libros."}</p>
          {owner && <button type="button" onClick={() => document.querySelector('[data-testid="input-post-title"]')?.scrollIntoView({ behavior: "smooth", block: "center" })} className={`${softButton} mt-4 border-fuchsia-200/25 text-fuchsia-100`} data-testid="button-start-post"><Plus className="h-4 w-4" /> Crear publicación</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {postsQuery.data.posts.map((post) => (
            <PostCard key={post.id} post={post} author={post.author_id ? authorsById.get(post.author_id) : undefined} currentUserId={user?.id} onRefresh={refreshSocial} />
          ))}
        </div>
      )}
      {onGoToVip && mode === "feed" && (
        <button type="button" onClick={onGoToVip} className="mx-auto flex items-center gap-2 text-xs text-fuchsia-100/55 transition hover:text-fuchsia-100" data-testid="button-social-vip">
          <Star className="h-3.5 w-3.5" /> Descubre más con AudiVerse VIP
        </button>
      )}
    </section>
  );
}