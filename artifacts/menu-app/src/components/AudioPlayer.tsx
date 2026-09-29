import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward,
  Rewind, FastForward, Volume2, VolumeX, BookOpen, Gauge, ChevronDown, ListOrdered,
} from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import VoiceCommandButton from "./VoiceCommandButton";
import ChaptersModal from "./ChaptersModal";

const SAMPLE_AUDIO = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const DEMO_TRACK = {
  id: "demo",
  titulo: "Demo — AudiVerse",
  autor: "Muestra de audio",
  portada_url: null as string | null,
};
const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

const fmt = (s: number) => {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export default function AudioPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const player = useAudioPlayer();
  const [showSpeed, setShowSpeed] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  const { data: libro } = useQuery({
    queryKey: ["libro", id],
    queryFn: async () => {
      const { data: l } = await supabase
        .from("libros")
        .select("id, titulo, autor, portada_url, genero, es_premium")
        .eq("id", id!)
        .single();
      if (!l) return null;
      const { data: audio } = await supabase
        .from("audiolibros")
        .select("audio_url")
        .eq("libro_id", id!)
        .maybeSingle();
      return { ...l, audio_url: audio?.audio_url ?? null };
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (id === "demo") {
      if (player.track?.id !== "demo") {
        player.loadAndPlay(DEMO_TRACK, SAMPLE_AUDIO);
      }
      return;
    }
    if (!libro) return;
    if (player.track?.id === libro.id) return;
    const audioSrc = libro.audio_url || SAMPLE_AUDIO;
    player.loadAndPlay(
      { id: libro.id, titulo: libro.titulo, autor: libro.autor, portada_url: libro.portada_url },
      audioSrc,
    );
  }, [libro?.id, id]);

  const { isPlaying, currentTime, duration, speed, volume, muted } = player;
  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const displayTrack = libro || (player.track ? {
    titulo: player.track.titulo,
    autor: player.track.autor,
    portada_url: player.track.portada_url,
  } : null);

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-b from-background via-background to-primary/10 text-foreground flex flex-col">
      {/* Top */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition">
          <ChevronDown className="w-5 h-5" /> Minimizar
        </button>
        <p className="text-xs font-semibold opacity-70">Reproduciendo</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Cover */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-64 h-64 max-w-[80vw] max-h-[40vh] rounded-2xl overflow-hidden shadow-2xl shadow-primary/30 bg-white/5">
          {displayTrack?.portada_url ? (
            <img src={displayTrack.portada_url} alt={displayTrack.titulo} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="text-center">
          <h1 className="font-bold text-lg leading-tight line-clamp-2">{displayTrack?.titulo || "Cargando..."}</h1>
          <p className="text-sm text-muted-foreground mt-1">{displayTrack?.autor}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-8 space-y-4 glass-panel rounded-t-3xl pt-6">
        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => player.seek(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${progressPct}%, rgba(255,255,255,0.1) ${progressPct}%)` }}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={() => player.skip(-30)} className="p-2 opacity-80 hover:opacity-100 transition" aria-label="Retroceder 30s">
            <Rewind className="w-6 h-6" />
          </button>
          <button onClick={() => player.skip(-10)} className="p-2 opacity-80 hover:opacity-100 transition" aria-label="Retroceder 10s">
            <SkipBack className="w-7 h-7" />
          </button>
          <button
            onClick={player.togglePlay}
            className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition"
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          <button onClick={() => player.skip(10)} className="p-2 opacity-80 hover:opacity-100 transition" aria-label="Avanzar 10s">
            <SkipForward className="w-7 h-7" />
          </button>
          <button onClick={() => player.skip(30)} className="p-2 opacity-80 hover:opacity-100 transition" aria-label="Avanzar 30s">
            <FastForward className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="relative">
            <button
              onClick={() => setShowSpeed((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold hover:bg-white/20 transition"
            >
              <Gauge className="w-3.5 h-3.5" />
              {speed}x
            </button>
            {showSpeed && (
              <div className="absolute bottom-full left-0 mb-2 glass-panel rounded-xl p-2 flex flex-col gap-1 min-w-[80px] animate-in fade-in slide-in-from-bottom-2">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { player.setSpeed(s); setShowSpeed(false); }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium text-left transition ${
                      speed === s ? "bg-primary text-primary-foreground" : "hover:bg-white/10"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-[140px] ml-4">
            <button onClick={player.toggleMute} className="opacity-80 hover:opacity-100 transition">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => player.setVolume(Number(e.target.value))}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-primary"
              style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(muted ? 0 : volume) * 100}%)` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <VoiceCommandButton onShowChapters={() => setShowChapters(true)} />
          <button
            onClick={() => setShowChapters(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold hover:bg-white/20 transition"
            aria-label="Ver capítulos"
          >
            <ListOrdered className="w-3.5 h-3.5" /> Capítulos
          </button>
        </div>
      </div>

      <ChaptersModal open={showChapters} onClose={() => setShowChapters(false)} />
    </div>
  );
}
