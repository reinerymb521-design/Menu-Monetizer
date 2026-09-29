import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { useState } from "react";

interface Props {
  url: string;
  titulo: string;
  onClose: () => void;
}

export default function PDFViewerModal({ url, titulo, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [readingMode, setReadingMode] = useState(false);

  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: readingMode ? "#f5ead0" : "var(--color-background)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0 border-b"
        style={{
          background: readingMode ? "#e8d9b0" : "rgba(15,23,42,0.85)",
          borderColor: readingMode ? "#c9aa70" : "rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <button
          onClick={onClose}
          className="p-2 rounded-full transition shrink-0"
          style={{ color: readingMode ? "#5a3e10" : "white" }}
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2
          className="text-sm font-semibold truncate flex-1"
          style={{ color: readingMode ? "#3d2800" : "white" }}
        >
          {titulo}
        </h2>

        {/* Botón Modo Lectura */}
        <button
          onClick={() => setReadingMode((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0"
          style={
            readingMode
              ? { background: "#c9aa70", color: "#3d2800" }
              : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }
          }
          aria-label="Modo lectura"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {readingMode ? "Modo normal" : "Modo lectura"}
        </button>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div
          className="absolute inset-0 top-14 flex flex-col items-center justify-center gap-3 z-10"
          style={{ background: readingMode ? "#f5ead0" : "var(--color-background)" }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando libro...</p>
        </div>
      )}

      {/* Visor PDF — con filtro cálido en modo lectura */}
      <iframe
        src={viewerUrl}
        className="flex-1 w-full border-0"
        title={titulo}
        onLoad={() => setLoading(false)}
        allow="fullscreen"
        style={readingMode ? { filter: "sepia(0.45) brightness(0.92) contrast(0.95)" } : {}}
      />
    </div>
  );
}
