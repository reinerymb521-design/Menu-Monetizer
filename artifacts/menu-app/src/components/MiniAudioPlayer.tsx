import { useNavigate, useLocation } from "react-router-dom";
import { Play, Pause, X, BookOpen } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export default function MiniAudioPlayer() {
  const { book, isPlaying, currentTime, duration, togglePlay, close } = useAudioPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on full player route
  if (!book || location.pathname.startsWith("/listen/")) return null;

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-16 left-2 right-2 z-[60] glass-panel rounded-xl shadow-2xl shadow-primary/20 border border-white/10 animate-in slide-in-from-bottom">
      {/* Progress strip */}
      <div className="h-0.5 w-full bg-white/10 rounded-t-xl overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center gap-2 p-2">
        <button
          onClick={() => navigate(`/listen/${book.id}`)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <div className="w-10 h-10 rounded-md bg-white/5 overflow-hidden shrink-0">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{book.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
          </div>
        </button>

        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:scale-105 transition"
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          onClick={close}
          className="p-1.5 rounded-full hover:bg-white/10 transition shrink-0"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
