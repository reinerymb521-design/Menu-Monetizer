import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Star, Heart, BookOpen, Check, Clock, MessageCircle, Send, Play } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string;
  type: string;
  is_premium: boolean;
  rating: number | null;
  description: string | null;
}

interface Props {
  book: Book;
  onClose: () => void;
}

export default function BookDetailModal({ book, onClose }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  // Check if favorited
  const { data: isFavorited } = useQuery({
    queryKey: ["favorite", book.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Reading progress
  const { data: progress } = useQuery({
    queryKey: ["reading_progress", book.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", book.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("book_id", book.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Toggle favorite
  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (isFavorited) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("book_id", book.id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, book_id: book.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite", book.id] });
      toast.success(isFavorited ? "Eliminado de favoritos" : "¡Añadido a favoritos!");
    },
  });

  // Update reading status
  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      if (!user) return;
      const progressPercent = status === "completed" ? 100 : status === "reading" ? 10 : 0;
      if (progress) {
        await supabase
          .from("reading_progress")
          .update({ status, progress_percent: progressPercent })
          .eq("user_id", user.id)
          .eq("book_id", book.id);
      } else {
        await supabase
          .from("reading_progress")
          .insert({ user_id: user.id, book_id: book.id, status, progress_percent: progressPercent });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading_progress", book.id] });
      toast.success("¡Estado actualizado!");
    },
  });

  // Submit review
  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user || !reviewContent.trim()) return;
      await supabase.from("reviews").insert({
        user_id: user.id,
        book_id: book.id,
        rating: reviewRating,
        content: reviewContent.trim(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", book.id] });
      setReviewContent("");
      toast.success("¡Reseña publicada!");
    },
    onError: (err: any) => {
      if (err.message?.includes("duplicate")) {
        toast.error("Ya has reseñado este libro");
      } else {
        toast.error("Error al publicar reseña");
      }
    },
  });

  const statusIcons = [
    { status: "want_to_read", icon: Clock, label: "Quiero leer" },
    { status: "reading", icon: BookOpen, label: "Leyendo" },
    { status: "completed", icon: Check, label: "Completado" },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-panel rounded-t-2xl sm:rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-3 flex-1 min-w-0">
            <div className="w-16 h-24 rounded-md bg-white/5 overflow-hidden shrink-0">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-foreground leading-tight line-clamp-2">{book.title}</h2>
              <p className="text-sm text-muted-foreground">{book.author}</p>
              <p className="text-xs text-primary mt-1">{book.genre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleFav.mutate()} className="p-2 rounded-full hover:bg-white/10 transition">
              <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
        )}

        {/* Read button */}
        <button
          onClick={() => { onClose(); navigate(book.type === "audiolibro" ? `/listen/${book.id}` : `/read/${book.id}`); }}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
        >
          <Play className="w-4 h-4" />
          {book.type === "audiolibro" ? "Escuchar ahora" : "Leer ahora"}
        </button>

        {user && (
          <div className="flex gap-2">
            {statusIcons.map(({ status, icon: Icon, label }) => (
              <button
                key={status}
                onClick={() => updateStatus.mutate(status)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition ${
                  progress?.status === status
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {progress && progress.status !== "want_to_read" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span>{progress.progress_percent}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress.progress_percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Reseñas ({reviews.length})
          </h3>

          {/* Write review */}
          {user && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star
                      className={`w-5 h-5 ${s <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe tu reseña..."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => submitReview.mutate()}
                  disabled={!reviewContent.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Review list */}
          {reviews.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Sin reseñas aún. ¡Sé el primero!</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white/5 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground">{r.content}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("es")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
