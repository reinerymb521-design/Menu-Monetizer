import { useState } from "react";
import { Book, Headphones, Crown, Heart } from "lucide-react";
import BookDetailModal from "./BookDetailModal";
import { useFavorites } from "@/hooks/useFavorites";

export interface Libro {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  url_portada: string | null;
  URL_PDF: string | null;
  es_premium: boolean;
}

export default function BookCard({ libro }: { libro: Libro }) {
  const [showDetail, setShowDetail] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(libro.id);

  return (
    <>
      <div
        className={`content-card space-y-1.5 cursor-pointer group ${libro.es_premium ? "premium-glow" : ""}`}
        onClick={() => setShowDetail(true)}
      >
        <div className="relative w-full aspect-[3/4] rounded-lg bg-white/5 overflow-hidden">
          {libro.url_portada ? (
            <img
              src={libro.url_portada}
              alt={libro.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40">
              <Book className="w-10 h-10" />
            </div>
          )}

          {/* Tipo de contenido */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold backdrop-blur-sm bg-black/60 text-white">
            {libro.URL_PDF ? <Book className="w-2.5 h-2.5" /> : <Headphones className="w-2.5 h-2.5" />}
            {libro.URL_PDF ? "Libro" : "Audio"}
          </div>

          {/* Corazón favorito */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(libro.id);
            }}
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition hover:scale-110"
            aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Heart
              className={`w-3.5 h-3.5 transition ${fav ? "fill-red-500 text-red-500" : "text-white/70"}`}
            />
          </button>

          {/* Corona premium */}
          {libro.es_premium && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400/90 flex items-center justify-center shadow-lg">
              <Crown className="w-3.5 h-3.5 text-yellow-900" />
            </div>
          )}
        </div>

        <h4 className="text-xs font-semibold leading-tight line-clamp-2 text-foreground">{libro.titulo}</h4>
        <p className="text-[10px] text-muted-foreground truncate">{libro.autor || "Autor desconocido"}</p>
      </div>

      {showDetail && <BookDetailModal libro={libro} onClose={() => setShowDetail(false)} />}
    </>
  );
}
