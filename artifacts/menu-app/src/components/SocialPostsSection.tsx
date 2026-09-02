import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreatePostModal } from "./CreatePostModal";
import { STORAGE_BUCKETS } from "@/lib/storageBuckets";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe2,
  Heart,
  Loader2,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Share2,
  Star,
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
  user_id: string | null;
  author_id: string | null;
  contenido: string | null;
  title: string;
  description: string | null;
  cover_url: string | null;
  cover_path: string | null;
  pdf_url: string | null;
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
         {(post.description || post.contenido) && (
          <p className="whitespace-pre-wrap text-sm leading-6 text-white/65" data-testid={`text-post-description-${post.id}`}>
             {post.description || post.contenido}
          </p>
        )}
        {(post.book_path || post.pdf_url) && (
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

export default function SocialPostsSection({
  mode,
  profileUserId,
  profileName,
  isOwner,
  onGoToVip,
}: SocialPostsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const postsQuery = useQuery({
    queryKey: ["social-posts", mode, profileUserId],
    queryFn: async () => {
      let query = db
        .from("social_posts")
        .select("id,user_id,author_id,contenido,title,description,visibility,cover_url,pdf_url,book_path,cover_path,created_at")
        .order("created_at", { ascending: false });

      if (mode === "profile" && profileUserId) {
        query = query.or(`author_id.eq.${profileUserId},user_id.eq.${profileUserId}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => {
        const isOfficial = !row.author_id && !row.user_id;
        const coverUrl =
          row.cover_url ||
          (row.cover_path
            ? db.storage.from(STORAGE_BUCKETS.socialPosts).getPublicUrl(row.cover_path).data.publicUrl
            : null);

        return {
          id: row.id,
          user_id: row.user_id ?? null,
          author_id: row.author_id ?? row.user_id ?? null,
          contenido: row.contenido ?? null,
          title: row.title || "Publicación sin título",
          description: row.description ?? null,
          cover_url: coverUrl,
          cover_path: row.cover_path ?? null,
          pdf_url: row.pdf_url ?? null,
          book_path: row.book_path ?? null,
          visibility: (row.visibility === "followers" || row.visibility === "private"
            ? row.visibility
            : "public") as Visibility,
          is_official: isOfficial,
          official_label: isOfficial ? "Equipo AudiVerse" : null,
          like_count: 0,
          comment_count: 0,
          share_count: 0,
          created_at: row.created_at,
        } satisfies SocialPost;
      });
    },
  });

  const authorsQuery = useQuery({
    queryKey: ["social-posts-authors", postsQuery.data],
    queryFn: async () => {
      const posts = postsQuery.data || [];
      const ids = Array.from(
        new Set(
          posts
            .map((p: SocialPost) => p.author_id)
            .filter((id: string | null): id is string => Boolean(id)),
        ),
      );
      if (!ids.length) return new Map<string, Profile>();

      const { data, error } = await db
        .from("perfiles")
        .select("user_id,display_name,avatar_url,perfil_publico")
        .in("user_id", ids);

      if (error) throw error;
      const map = new Map<string, Profile>();
      (data || []).forEach((item: Profile) => {
        if (item.user_id) map.set(item.user_id, item);
      });
      return map;
    },
    enabled: Boolean(postsQuery.data?.length),
  });

  const refreshSocial = async () => {
    await queryClient.invalidateQueries({ queryKey: ["social-posts"] });
  };

  const authorsById = authorsQuery.data || new Map<string, Profile>();

  return (
    <section className="space-y-6" data-testid="social-posts-section">
      {mode === "profile" && (
        <div className={`${glassCard} flex items-center justify-between p-5`}>
          <div>
            <h2 className="text-base font-bold text-white">Publicaciones de {profileName || "Usuario"}</h2>
            <p className="text-xs text-white/50">Actividad literaria y aportes en la comunidad.</p>
          </div>
          {isOwner && user && (
            <button type="button" onClick={() => setIsCreateModalOpen(true)} className={softButton} data-testid="button-open-create-modal">
              <Plus className="h-4 w-4 text-fuchsia-200" /> Crear post
            </button>
          )}
        </div>
      )}

      {mode === "feed" && user && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/[0.13]"
            data-testid="button-start-post"
          >
            <Plus className="h-4 w-4 text-fuchsia-200" /> Crear publicación
          </button>
        </div>
      )}

      <div className="space-y-4">
        {postsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${glassCard} h-48 animate-pulse p-4`} />
          ))
        ) : postsQuery.isError ? (
          <div className={`${glassCard} p-6 text-center text-xs text-rose-200`}>
            No se pudieron cargar las publicaciones.
          </div>
        ) : postsQuery.data?.length ? (
          postsQuery.data.map((post: SocialPost) => (
            <PostCard
              key={post.id}
              post={post}
              author={post.author_id && authorsById?.get ? authorsById.get(post.author_id) : undefined}
              currentUserId={user?.id}
              onRefresh={refreshSocial}
            />
          ))
        ) : (
          <div className={`${glassCard} p-8 text-center text-xs text-white/50`}>
            No hay publicaciones todavía.
          </div>
        )}
      </div>

      {onGoToVip && mode === "feed" && (
        <button
          type="button"
          onClick={onGoToVip}
          className="mx-auto flex items-center gap-2 text-xs text-fuchsia-100/55 transition hover:text-fuchsia-100"
          data-testid="button-social-vip"
        >
          <Star className="h-3.5 w-3.5" /> Descubre más con AudiVerse VIP
        </button>
      )}

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refreshSocial();
        }}
        currentUserId={user?.id}
      />
    </section>
  );
}
