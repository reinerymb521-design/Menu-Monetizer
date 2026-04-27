import { useState } from "react";
import { Crown, Book, Headphones, Star } from "lucide-react";
import BookDetailModal from "./BookDetailModal";

interface BookType {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  description: string | null;
  genre: string;
  type: string;
  is_premium: boolean;
  rating: number | null;
}

export default function BookCard({ book }: { book: BookType }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div
        className={`content-card space-y-2 cursor-pointer ${book.is_premium ? "premium-glow" : ""}`}
        onClick={() => setShowDetail(true)}
      >
        {book.is_premium && (
          <div className="absolute top-2 right-2">
            <Crown className="w-4 h-4 text-yellow-400" />
          </div>
        )}
        <div className="w-full aspect-[3/4] rounded-md bg-white/5 flex items-center justify-center overflow-hidden">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              {book.type === "audiolibro" ? <Headphones className="w-8 h-8" /> : <Book className="w-8 h-8" />}
            </div>
          )}
        </div>
        <h4 className="text-xs font-semibold leading-tight line-clamp-2">{book.title}</h4>
        <p className="text-[10px] text-muted-foreground">{book.author}</p>
        {book.rating && book.rating > 0 && (
          <div className="flex items-center gap-0.5 justify-center">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] text-muted-foreground">{book.rating}</span>
          </div>
        )}
      </div>

      {showDetail && <BookDetailModal book={book} onClose={() => setShowDetail(false)} />}
    </>
  );
}
