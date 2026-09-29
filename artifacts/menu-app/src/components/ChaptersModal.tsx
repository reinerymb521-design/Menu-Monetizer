import { X, ListOrdered, Play } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

const fmt = (s: number) => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function ChaptersModal({ open, onClose }: Props) {
  const player = useAudioPlayer();
  if (!open) return null;

  const total = player.duration || 0;
  const chapterCount = total > 0 ? Math.max(4, Math.min(12, Math.ceil(total / (5 * 60)))) : 0;
  const chapters = Array.from({ length: chapterCount }, (_, i) => ({
    index: i + 1,
    start: (i / chapterCount) * total,
  }));
  const currentIdx = chapters.findIndex(
    (c, i) =>
      player.currentTime >= c.start &&
      (i === chapters.length - 1 || player.currentTime < chapters[i + 1].start),
  );

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md glass-panel rounded-t-3xl sm:rounded-2xl p-5 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            Capítulos
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Cargando información del audiolibro...
          </p>
        ) : (
          <ul className="space-y-1 overflow-y-auto -mx-1 px-1">
            {chapters.map((c, i) => {
              const isCurrent = i === currentIdx;
              return (
                <li key={c.index}>
                  <button
                    onClick={() => {
                      player.seek(c.start);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition text-left ${
                      isCurrent
                        ? "bg-primary/20 ring-1 ring-primary/40"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/10"
                        }`}
                      >
                        {c.index}
                      </span>
                      <span className="text-sm font-medium truncate">
                        Capítulo {c.index}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 flex items-center gap-2">
                      {fmt(c.start)}
                      {isCurrent && (
                        <Play className="w-3 h-3 fill-primary text-primary" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Capítulos generados automáticamente por tiempo
        </p>
      </div>
    </div>
  );
}
