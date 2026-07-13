import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Play, Pause, X, BookOpen, Maximize2 } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

const PLAYER_W = 200;
const PLAYER_H = 72;

export default function MiniAudioPlayer() {
  const { track, isPlaying, currentTime, duration, togglePlay, close } =
    useAudioPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [pos, setPos] = useState({ x: -1, y: -1 });
  const posRef = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /* place bottom-right on first render */
  useEffect(() => {
    if (pos.x === -1) {
      const x = window.innerWidth - PLAYER_W - 12;
      const y = window.innerHeight - PLAYER_H - 72;
      setPos({ x, y });
      posRef.current = { x, y };
    }
  }, [pos.x]);

  const clamp = useCallback((x: number, y: number) => ({
    x: Math.max(0, Math.min(window.innerWidth  - PLAYER_W, x)),
    y: Math.max(0, Math.min(window.innerHeight - PLAYER_H - 56, y)),
  }), []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragging.current = true;
    hasDragged.current = false;
    const rect = containerRef.current!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragOffset.current.x - posRef.current.x;
    const dy = e.clientY - dragOffset.current.y - posRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    const next = clamp(
      e.clientX - dragOffset.current.x,
      e.clientY - dragOffset.current.y,
    );
    posRef.current = next;
    if (containerRef.current) {
      containerRef.current.style.left = `${next.x}px`;
      containerRef.current.style.top  = `${next.y}px`;
    }
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setPos({ ...posRef.current });
  };

  const handleCardClick = () => {
    if (!hasDragged.current && track) navigate(`/listen/${track.id}`);
  };

  if (!track || location.pathname.startsWith("/listen/")) return null;
  if (pos.x === -1) return null;

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleCardClick}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: PLAYER_W,
        zIndex: 9999,
        touchAction: "none",
        userSelect: "none",
        cursor: dragging.current ? "grabbing" : "grab",
      }}
      className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Glass background */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(20,30,60,0.88) 0%, rgba(10,15,40,0.92) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {/* Progress bar on top */}
        <div className="h-0.5 w-full bg-white/10">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-2 p-2">
          {/* Album art */}
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 shadow-inner">
            {track.portada_url ? (
              <img
                src={track.portada_url}
                alt={track.titulo}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate leading-tight">
              {track.titulo}
            </p>
            <p className="text-[10px] text-white/50 truncate mt-0.5">
              {track.autor}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition active:scale-95"
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying
                ? <Pause className="w-4 h-4" />
                : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); close(); }}
              className="w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center transition"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Tap to expand hint */}
        <div className="flex items-center justify-center gap-1 pb-1.5">
          <Maximize2 className="w-2.5 h-2.5 text-white/25" />
          <span className="text-[9px] text-white/25 font-medium">Toca para abrir</span>
        </div>
      </div>
    </div>
  );
}
