import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface Props {
  onShowChapters: () => void;
}

type SR = any;

const getSR = (): SR | null => {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

const matches = (text: string, phrases: string[]) =>
  phrases.some((p) => text.includes(p));

export default function VoiceCommandButton({ onShowChapters }: Props) {
  const player = useAudioPlayer();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SR | null>(null);

  useEffect(() => {
    const SRCtor = getSR();
    if (!SRCtor) {
      setSupported(false);
      return;
    }
    const r = new SRCtor();
    r.lang = "es-ES";
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 3;

    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = (e: any) => {
      setListening(false);
      if (e?.error === "not-allowed") {
        toast.error("Permiso del micrófono denegado");
      } else if (e?.error !== "no-speech" && e?.error !== "aborted") {
        toast.error(`Error de voz: ${e?.error ?? "desconocido"}`);
      }
    };
    r.onresult = (event: any) => {
      const transcript = (event.results?.[0]?.[0]?.transcript ?? "")
        .toLowerCase()
        .trim();
      if (!transcript) return;

      if (
        matches(transcript, [
          "reproducir donde me quedé",
          "reproducir donde me quede",
          "donde me quedé",
          "donde me quede",
          "reanudar",
          "continuar",
        ])
      ) {
        toast.success("▶️ Reanudando desde donde te quedaste");
        player.resumeFromSaved();
      } else if (
        matches(transcript, ["siguiente", "próximo", "proximo", "adelante"])
      ) {
        toast.success("⏭️ Siguiente");
        player.nextTrack();
      } else if (matches(transcript, ["anterior", "atrás", "atras"])) {
        toast.success("⏮️ Anterior");
        player.prevTrack();
      } else if (
        matches(transcript, ["lista", "capítulos", "capitulos", "índice", "indice"])
      ) {
        toast.success("📜 Abriendo capítulos");
        onShowChapters();
      } else if (matches(transcript, ["pausa", "pausar", "detén", "deten"])) {
        toast.success("⏸️ Pausa");
        player.pause();
      } else if (matches(transcript, ["reproduce", "reproducir", "play"])) {
        toast.success("▶️ Reproduciendo");
        player.play();
      } else {
        toast(`No entendí: "${transcript}"`);
      }
    };

    recognitionRef.current = r;
    return () => {
      try {
        r.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [player, onShowChapters]);

  const toggle = () => {
    const r = recognitionRef.current;
    if (!r) return;
    if (listening) {
      try {
        r.stop();
      } catch {
        /* ignore */
      }
    } else {
      try {
        r.start();
      } catch {
        /* already started — ignore */
      }
    }
  };

  if (!supported) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs font-semibold opacity-40 cursor-not-allowed"
        title="Tu navegador no soporta reconocimiento de voz"
      >
        <MicOff className="w-3.5 h-3.5" /> Voz
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
        listening
          ? "bg-red-500/20 text-red-300 ring-2 ring-red-500/60"
          : "bg-white/10 hover:bg-white/20"
      }`}
      aria-label={listening ? "Escuchando" : "Comando de voz"}
      title={
        listening
          ? "Escuchando... Di un comando"
          : "Toca y di: 'reproducir donde me quedé', 'siguiente', 'anterior' o 'lista'"
      }
    >
      <Mic
        className={`w-3.5 h-3.5 ${listening ? "animate-pulse" : ""}`}
      />
      {listening ? "Escuchando..." : "Voz"}
      {listening && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
      )}
    </button>
  );
}
