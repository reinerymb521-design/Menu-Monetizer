import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "sonner";

export interface TrackInfo {
  id: string;
  titulo: string;
  autor: string;
  portada_url: string | null;
}

interface AudioPlayerContextValue {
  track: TrackInfo | null;
  src: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  volume: number;
  muted: boolean;
  loadAndPlay: (track: TrackInfo, src: string) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
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

const CHAPTER_STEP_SECONDS = 5 * 60;

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current && typeof Audio !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrentTime(a.currentTime);
    const onLoad = () => setDuration(a.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => {
      setIsPlaying(false);
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
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const loadAndPlay = useCallback(
    (t: TrackInfo, source: string) => {
      const a = audioRef.current;
      if (!a) return;
      if (track?.id !== t.id || src !== source) {
        a.src = source;
        setSrc(source);
        setTrack(t);
        setCurrentTime(0);
        setDuration(0);
      }
      a.play().catch(() => {});
    },
    [track, src],
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

  const nextTrack = useCallback(() => skip(CHAPTER_STEP_SECONDS), [skip]);
  const prevTrack = useCallback(() => skip(-CHAPTER_STEP_SECONDS), [skip]);

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
    setTrack(null);
    setSrc(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
  }, []);

  // navigator.mediaSession integration
  useEffect(() => {
    if (!("mediaSession" in navigator) || !track) return;
    const cover = track.portada_url || undefined;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.titulo,
      artist: track.autor,
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
      ["seekbackward", (d) => skip(-(d?.seekOffset ?? 10))],
      ["seekforward", (d) => skip(d?.seekOffset ?? 10)],
      ["seekto", (d) => { if (typeof d?.seekTime === "number") seek(d.seekTime); }],
    ];
    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported */ }
    }
    return () => {
      for (const [action] of handlers) {
        try { navigator.mediaSession.setActionHandler(action, null); } catch { /* ignore */ }
      }
    };
  }, [track, play, pause, nextTrack, prevTrack, skip, seek]);

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
    } catch { /* not supported */ }
  }, [currentTime, duration, speed]);

  return (
    <AudioPlayerContext.Provider
      value={{
        track,
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
