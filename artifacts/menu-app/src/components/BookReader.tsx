import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Sun, Moon, Type, Minus, Plus,
  ChevronLeft, ChevronRight, BookOpen,
} from "lucide-react";

type Theme = "dark" | "light" | "sepia";

const THEMES: Record<Theme, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  dark: { bg: "bg-background", text: "text-foreground", label: "Oscuro", icon: <Moon className="w-4 h-4" /> },
  light: { bg: "bg-white", text: "text-gray-900", label: "Claro", icon: <Sun className="w-4 h-4" /> },
  sepia: { bg: "bg-amber-50", text: "text-amber-950", label: "Sepia", icon: <BookOpen className="w-4 h-4" /> },
};

const SAMPLE_CONTENT = [
  "Capítulo 1\n\nEn un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.\n\nUna olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.",
  "El resto della concluían sayo de velarte, calzas de velludo para las fiestas, con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellorí de lo más fino.\n\nTenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza, que así ensillaba el rocín como tomaba la podadera.",
  "Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza.\n\nQuieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que de este caso escriben.",
  "Pero esto importa poco a nuestro cuento; basta que en la narración dél no se salga un punto de la verdad.\n\nEs, pues, de saber que este sobredicho hidalgo, los ratos que estaba ocioso —que eran los más del año—, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza.",
  "Y aun la administración de su hacienda; y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer.\n\nCapítulo 2\n\nY con estas razones perdía el pobre caballero el juicio, y desvelábase por entenderlas y desentrañarles el sentido.",
];

export default function BookReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<Theme>("dark");
  const [fontSize, setFontSize] = useState(18);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const { data: libro } = useQuery({
    queryKey: ["libro", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("libros")
        .select("id, titulo, autor, descripcion")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const totalPages = SAMPLE_CONTENT.length;
  const progressPercent = Math.round(((currentPage + 1) / totalPages) * 100);

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  }, [currentPage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, navigate]);

  const t = THEMES[theme];

  return (
    <div className={`fixed inset-0 z-[200] ${t.bg} ${t.text} flex flex-col transition-colors duration-300`}>
      {/* Top bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: theme === "dark" ? "rgba(15,23,42,0.9)" : theme === "sepia" ? "rgba(180,130,70,0.15)" : "rgba(255,255,255,0.95)" }}
      >
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition">
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        <div className="text-center flex-1 min-w-0 px-4">
          <p className="text-xs font-semibold truncate">{libro?.titulo || "Cargando..."}</p>
          <p className="text-[10px] opacity-60">{libro?.autor}</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-white/10 transition">
          <Type className="w-5 h-5" />
        </button>
      </div>

      {showSettings && showControls && (
        <div
          className="mx-4 mb-2 p-4 rounded-xl space-y-4 animate-in slide-in-from-top"
          style={{
            background: theme === "dark" ? "rgba(30,41,59,0.95)" : theme === "sepia" ? "rgba(180,130,70,0.12)" : "rgba(240,240,240,0.98)",
            border: "1px solid rgba(128,128,128,0.2)",
          }}
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold opacity-70">Tema</p>
            <div className="flex gap-2">
              {(Object.keys(THEMES) as Theme[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setTheme(k)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                    theme === k ? "bg-primary text-primary-foreground" : "bg-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  {THEMES[k].icon}
                  {THEMES[k].label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold opacity-70">Tamaño de letra</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFontSize((s) => Math.max(12, s - 2))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold flex-1 text-center">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(32, s + 2))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto px-6 py-8 cursor-pointer select-none"
        onClick={() => setShowControls((c) => !c)}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
      >
        <div className="max-w-2xl mx-auto whitespace-pre-wrap leading-relaxed">
          {libro?.descripcion ? `${SAMPLE_CONTENT[currentPage]}\n\n— ${libro.descripcion}` : SAMPLE_CONTENT[currentPage]}
        </div>
      </div>

      <div
        className={`px-4 py-3 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: theme === "dark" ? "rgba(15,23,42,0.9)" : theme === "sepia" ? "rgba(180,130,70,0.15)" : "rgba(255,255,255,0.95)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(128,128,128,0.2)" }}>
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-[10px] opacity-60 shrink-0">{progressPercent}%</span>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={goPrev} disabled={currentPage === 0} className="flex items-center gap-1 text-sm opacity-70 hover:opacity-100 disabled:opacity-30 transition">
            <ChevronLeft className="w-5 h-5" /> Anterior
          </button>
          <span className="text-xs opacity-50">{currentPage + 1} / {totalPages}</span>
          <button onClick={goNext} disabled={currentPage === totalPages - 1} className="flex items-center gap-1 text-sm opacity-70 hover:opacity-100 disabled:opacity-30 transition">
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
