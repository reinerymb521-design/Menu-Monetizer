import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, BookOpen, Play, Crown, Lock, Headphones, Loader2, FileText } from "lucide-react";
import type { Libro } from "./BookCard";

interface Props {
  book: Libro;
  onClose: () => void;
}

export default function BookDetailModal({ book, onClose }: Props) {
  const { isPremium } = useAuth();
  const { loadAndPlay } = useAudioPlayer();

  const canAccess = !book.es_premium || isPremium;

  const { data: audiolibros = [], isLoading: loadingAudio } = useQuery({
    queryKey: ["audiolibros", book.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("audiolibros")
        .select("id, titulo, audio_url")
        .eq("libro_id", book.id);
      return data ?? [];
    },
    enabled: canAccess,
  });

  const { data: pdfUrl = null } = useQuery({
    queryKey: ["libro_pdf_url", book.id],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("libros")
          .select("URL_PDF")
          .eq("id", book.id)
          .single();
        return (data as any)?.URL_PDF ?? null;
      } catch {
        return null;
      }
    },
    enabled: canAccess,
    initialData: book.URL_PDF ?? null,
  });

  const handlePlay = (a: { id: string; titulo: string; audio_url: string }) => {
    loadAndPlay(
      {
        id: a.id,
        titulo: a.titulo || book.titulo,
        autor: book.autor,
        portada_url: book.url_portada ?? null,
      },
      a.audio_url,
    );
    onClose();
  };

  const hasPdf = !!pdfUrl;
  const hasContent = hasPdf || audiolibros.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-panel rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            <div className="w-16 h-24 rounded-md bg-white/5 overflow-hidden shrink-0">
              {book.url_portada ? (
                <img src={book.url_portada} alt={book.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-foreground leading-tight line-clamp-2">{book.titulo}</h2>
              <p className="text-sm text-muted-foreground">{book.autor}</p>
              <p className="text-xs text-primary mt-1">{book.genero}</p>
              {book.es_premium && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-semibold">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition shrink-0">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Acciones */}
        {!canAccess ? (
          <div className="w-full py-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 font-semibold text-sm flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> Contenido exclusivo VIP
          </div>
        ) : (
          <div className="space-y-3">
            {/* Botón PDF */}
            {hasPdf && (
              <a
                href={pdfUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition"
              >
                <FileText className="w-4 h-4" /> Leer PDF
              </a>
            )}

            {/* Capítulos de audio */}
            {loadingAudio ? (
              <div className="flex justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : audiolibros.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5" />
                  {audiolibros.length === 1 ? "Audiolibro" : `${audiolibros.length} capítulos`}
                </p>
                {audiolibros.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => handlePlay(a)}
                    className="w-full py-2.5 px-3 rounded-lg bg-primary/10 border border-primary/20 text-foreground text-sm flex items-center gap-2 hover:bg-primary/20 transition text-left"
                  >
                    <Play className="w-4 h-4 text-primary shrink-0" />
                    <span className="line-clamp-1">{a.titulo || book.titulo}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Sin contenido */}
            {!loadingAudio && !hasContent && (
              <div className="glass-panel p-4 text-center text-muted-foreground text-sm">
                Este libro aún no tiene audio ni PDF disponible.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
