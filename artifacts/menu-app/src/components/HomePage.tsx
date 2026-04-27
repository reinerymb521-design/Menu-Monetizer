import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BookCard from "./BookCard";

const GENRES = [
  { label: "Todos", emoji: "" },
  { label: "Terror", emoji: "👻" },
  { label: "Romance", emoji: "💖" },
  { label: "Ciencia Ficción", emoji: "🚀" },
  { label: "Aventura", emoji: "🏔️" },
  { label: "Fantasía", emoji: "🧙" },
  { label: "Misterio", emoji: "🔍" },
];

interface Props {
  searchQuery: string;
}

export default function HomePage({ searchQuery }: Props) {
  const [activeGenre, setActiveGenre] = useState("Todos");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", activeGenre, searchQuery],
    queryFn: async () => {
      let query = supabase.from("books").select("*").order("created_at", { ascending: false });
      if (activeGenre !== "Todos") query = query.eq("genre", activeGenre);
      if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Descubre</h2>
        <p className="text-sm text-muted-foreground">Contenido reciente para ti</p>
      </div>

      {/* Genre Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {GENRES.map((g) => (
          <button
            key={g.label}
            onClick={() => setActiveGenre(g.label)}
            className={`chip ${activeGenre === g.label ? "active" : ""}`}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="loader-spinner" />
        </div>
      ) : books.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <p className="text-sm">No hay contenido aún. ¡Pronto se llenará el universo! 🌌</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}
