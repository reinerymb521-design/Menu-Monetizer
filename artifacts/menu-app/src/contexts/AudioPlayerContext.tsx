import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TrackBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
}

interface AudioPlayerContextValue {
  book: TrackBook | null;
  src: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  volume: number;
  muted: boolean;
  loadAndPlay: (book: TrackBook, src: string) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  resumeFromSaved: () => Promise<void>;
  setSpeed: (s: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  close: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export const useAudioPlayer = () => {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx)
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
};

// Approx. minutes-per-"chapter" used by next/prev when no real chapter list.
const CHAPTER_STEP_SECONDS = 5 * 60;

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  const [book, setBook] = useState<TrackBook | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  // Wire audio events
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onLoad = () => setDuration(a.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = async () => {
      setIsPlaying(false);
      if (user && book) {
        await supabase.from("reading_progress").upsert(
          {
            user_id: user.id,
            book_id: book.id,
            progress_percent: 100,
            status: "completed",
          },
          { onConflict: "user_id,book_id" },
        );
      }
      toast.success("¡Audiolibro completado!");
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoad);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoad);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
    };
  }, [user, book]);

  // Apply rate / volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Periodic progress save
  useEffect(() => {
    if (!isPlaying || !duration || !user || !book) return;
    const i = setInterval(async () => {
      const pct = Math.round((currentTime / duration) * 100);
      if (pct > 0 && pct < 100) {
        await supabase.from("reading_progress").upsert(
          {
            user_id: user.id,
            book_id: book.id,
            progress_percent: pct,
            status: "reading",
          },
          { onConflict: "user_id,book_id" },
        );
      }
    }, 15000);
    return () => clearInterval(i);
  }, [isPlaying, currentTime, duration, user, book]);

  const loadAndPlay = useCallback(
    (b: TrackBook, source: string) => {
      const a = audioRef.current;
      if (!a) return;
      if (book?.id !== b.id || src !== source) {
        a.src = source;
        setSrc(source);
        setBook(b);
        setCurrentTime(0);
        setDuration(0);
      }
      a.play().catch(() => {});
    },
    [book, src],
  );

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);
  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [src]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || 0, t));
    setCurrentTime(a.currentTime);
  }, []);

  const skip = useCallback(
    (delta: number) => {
      const a = audioRef.current;
      if (a) seek(a.currentTime + delta);
    },
    [seek],
  );

  const nextTrack = useCallback(() => {
    skip(CHAPTER_STEP_SECONDS);
  }, [skip]);
  const prevTrack = useCallback(() => {
    skip(-CHAPTER_STEP_SECONDS);
  }, [skip]);

  const resumeFromSaved = useCallback(async () => {
    const a = audioRef.current;
    if (!a || !book) {
      toast.error("Primero abre un audiolibro");
      return;
    }
    if (user) {
      const { data } = await supabase
        .from("reading_progress")
        .select("progress_percent")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .maybeSingle();
      const pct = data?.progress_percent ?? 0;
      const target = a.duration && pct ? (pct / 100) * a.duration : 0;
      a.currentTime = target;
      setCurrentTime(target);
    }
    a.play().catch(() => {});
  }, [book, user]);

  const setSpeed = useCallback((s: number) => setSpeedState(s), []);
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setMuted(false);
  }, []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const close = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setBook(null);
    setSrc(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
  }, []);

  // ── navigator.mediaSession: lock screen + Bluetooth headphone buttons ──────
  useEffect(() => {
    if (!("mediaSession" in navigator) || !book) return;
    const cover = book.cover_url || undefined;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: book.title,
      artist: book.author,
      album: "AudiVerse",
      artwork: cover
        ? [
            { src: cover, sizes: "96x96", type: "image/png" },
            { src: cover, sizes: "192x192", type: "image/png" },
            { src: cover, sizes: "512x512", type: "image/png" },
          ]
        : [],
    });

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
      ["play", () => play()],
      ["pause", () => pause()],
      ["previoustrack", () => prevTrack()],
      ["nexttrack", () => nextTrack()],
      [
        "seekbackward",
        (details) => skip(-(details?.seekOffset ?? 10)),
      ],
      [
        "seekforward",
        (details) => skip(details?.seekOffset ?? 10),
      ],
      [
        "seekto",
        (details) => {
          if (typeof details?.seekTime === "number") seek(details.seekTime);
        },
      ],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* unsupported action — ignore */
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          /* ignore */
        }
      }
    };
  }, [book, play, pause, nextTrack, prevTrack, skip, seek]);

  // Keep playbackState + position state in sync
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(currentTime, duration),
        playbackRate: speed,
      });
    } catch {
      /* not supported in some browsers */
    }
  }, [currentTime, duration, speed]);

  return (
    <AudioPlayerContext.Provider
      value={{
        book,
        src,
        isPlaying,
        currentTime,
        duration,
        speed,
        volume,
        muted,
        loadAndPlay,
        togglePlay,
        play,
        pause,
        seek,
        skip,
        nextTrack,
        prevTrack,
        resumeFromSaved,
        setSpeed,
        setVolume,
        toggleMute,
        close,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
