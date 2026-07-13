import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  url: string;
  titulo: string;
  onClose: () => void;
}

export default function PDFViewerModal({ url, titulo, onClose }: Props) {
  const [loading, setLoading] = useState(true);

  // Google Docs Viewer renderiza PDFs dentro del navegador sin pedir descarga
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      {/* Header con botón de regreso */}
      <div className="glass-header flex items-center gap-3 px-4 py-3 shrink-0 border-b border-white/10">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition shrink-0"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="text-sm font-semibold truncate flex-1 text-foreground">{titulo}</h2>
      </div>

      {/* Indicador de carga */}
      {loading && (
        <div className="absolute inset-0 top-14 flex flex-col items-center justify-center gap-3 text-muted-foreground z-10 bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Cargando libro...</p>
        </div>
      )}

      {/* Visor PDF via Google Docs */}
      <iframe
        src={viewerUrl}
        className="flex-1 w-full border-0"
        title={titulo}
        onLoad={() => setLoading(false)}
        allow="fullscreen"
      />
    </div>
  );
}
