import { ArrowLeft } from "lucide-react";

interface Props {
  url: string;
  titulo: string;
  onClose: () => void;
}

export default function PDFViewerModal({ url, titulo, onClose }: Props) {
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

      {/* Visor PDF */}
      <iframe
        src={url}
        className="flex-1 w-full border-0 bg-white"
        title={titulo}
        allow="fullscreen"
      />
    </div>
  );
}
