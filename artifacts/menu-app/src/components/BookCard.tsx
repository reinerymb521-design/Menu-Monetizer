import { useState } from "react";
import { Crown, Book, Headphones } from "lucide-react";
import BookDetailModal from "./BookDetailModal";

export interface Libro {
  id: string;
  titulo: string;
  autor: string;
  portada_url: string | null;
  descripcion: string | null;
  genero: string;
  es_premium: boolean;
  pdf_url?: string | null;
}

export default function BookCard({ book }: { book: Libro }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div
        className={`content-card space-y-2 cursor-pointer ${book.es_premium ? "premium-glow" : ""}`}
        onClick={() => setShowDetail(true)}
      >
        {book.es_premium && (
          <div className="absolute top-2 right-2">
            <Crown className="w-4 h-4 text-yellow-400" />
          </div>
        )}
        <div className="w-full aspect-[3/4] rounded-md bg-white/5 flex items-center justify-center overflow-hidden">
          {book.portada_url ? (
            <img src={book.portada_url} alt={book.titulo} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Book className="w-8 h-8" />
            </div>
          )}
        </div>
        <h4 className="text-xs font-semibold leading-tight line-clamp-2">{book.titulo}</h4>
        <p className="text-[10px] text-muted-foreground">{book.autor}</p>
      </div>

      {showDetail && <BookDetailModal book={book} onClose={() => setShowDetail(false)} />}
    </>
  );
}
