import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, BookOpen, Play, Crown, Lock, Headphones, Loader2, BookText } from "lucide-react";
import type { Libro } from "./BookCard";
import PDFViewerModal from "./PDFViewerModal";

interface Props {
  libro: Libro;
  onClose: () => void;
}

export default function BookDetailModal({ libro, onClose }: Props) {
  const { isPremium } = useAuth();
  const { loadAndPlay } = useAudioPlayer();
  const [showPDF, setShowPDF] = useState(false);

  const canAccess = !libro.es_premium || isPremium;

  const { data: audiolibros = [], isLoading: loadingAudio } = useQuery({
    queryKey: ["audiolibros", libro.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("audiolibros")
        .select("id, titulo, audio_url")
        .eq("libro_id", libro.id);
      return data ?? [];
    },
    enabled: canAccess,
  });

  const pdfUrl: string | null = libro.URL_PDF ?? null;

  const handlePlay = (a: { id: string; titulo: string; audio_url: string }) => {
    loadAndPlay(
      {
        id: a.id,
        titulo: a.titulo || libro.titulo,
        autor: libro.autor,
        portada_url: libro.url_portada ?? null,
      },
      a.audio_url,
    );
    onClose();
  };

  // Abre el PDF viewer directamente dentro de la app
  if (showPDF && pdfUrl) {
    return <PDFViewerModal url={pdfUrl} titulo={libro.titulo} onClose={() => setShowPDF(false)} />;
  }

  const hasPdf = !!pdfUrl;
  const hasAudio = audiolibros.length > 0;

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
              {libro.url_portada ? (
                <img src={libro.url_portada} alt={libro.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-foreground leading-tight line-clamp-2">{libro.titulo}</h2>
              <p className="text-sm text-muted-foreground">{libro.autor}</p>
              <p className="text-xs text-primary mt-1">{libro.genero}</p>
              {libro.es_premium && (
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

            {/* Botones principales: Leer libro + Escuchar */}
            <div className={`grid gap-3 ${hasPdf && hasAudio ? "grid-cols-2" : "grid-cols-1"}`}>
              {/* Leer libro (PDF) */}
              {hasPdf && (
                <button
                  onClick={() => setShowPDF(true)}
                  className="py-3 rounded-xl bg-primary/15 border border-primary/30 text-primary font-semibold text-sm flex flex-col items-center gap-1.5 hover:bg-primary/25 transition"
                >
                  <BookText className="w-5 h-5" />
                  <span>Leer libro</span>
                </button>
              )}

              {/* Escuchar (audio — manos libres) */}
              {loadingAudio ? (
                <div className="py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : hasAudio ? (
                <button
                  onClick={() => handlePlay(audiolibros[0] as any)}
                  className="py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 font-semibold text-sm flex flex-col items-center gap-1.5 hover:bg-green-500/25 transition"
                >
                  <Headphones className="w-5 h-5" />
                  <span>Escuchar</span>
                </button>
              ) : null}
            </div>

            {/* Lista de capítulos si hay más de uno */}
            {!loadingAudio && audiolibros.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5" />
                  {audiolibros.length} capítulos
                </p>
                {audiolibros.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => handlePlay(a)}
                    className="w-full py-2.5 px-3 rounded-lg bg-white/5 border border-white/10 text-foreground text-sm flex items-center gap-2 hover:bg-white/10 transition text-left"
                  >
                    <Play className="w-4 h-4 text-primary shrink-0" />
                    <span className="line-clamp-1">{a.titulo || libro.titulo}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Sin contenido */}
            {!loadingAudio && !hasPdf && !hasAudio && (
              <div className="glass-panel p-4 text-center text-muted-foreground text-sm">
                Este libro aún no tiene audio ni texto disponible.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
