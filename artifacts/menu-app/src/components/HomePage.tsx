import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BookCard from "./BookCard";
import { BookOpen } from "lucide-react";
import type { SearchFilters } from "./SearchBar";

const GENEROS = [
  { label: "Todos",                      emoji: "🌎" },
  { label: "Drama y Romance",            emoji: "💖" },
  { label: "Ciencia Ficción y Aventura", emoji: "🚀" },
  { label: "Terror y Suspenso",          emoji: "👻" },
  { label: "Misterio",                   emoji: "🔍" },
];

interface Props {
  searchQuery: string;
  filters: SearchFilters;
}

export default function HomePage({ searchQuery, filters }: Props) {
  const [activeGenre, setActiveGenre] = useState("Todos");

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["libros", activeGenre, searchQuery, filters],
    queryFn: async () => {
      let q = supabase
        .from("libros")
        .select("id, titulo, autor, portada_url, genero, es_premium, pdf_url")
        .order("created_at", { ascending: false });

      const generoFilter = filters.genero || (activeGenre !== "Todos" ? activeGenre : "");
      if (generoFilter) q = q.ilike("genero", `%${generoFilter}%`);
      if (searchQuery) q = q.or(`titulo.ilike.%${searchQuery}%,autor.ilike.%${searchQuery}%`);

      const { data, error } = await q;
      if (error) {
        console.error("[libros query]", error.message);
        return [];
      }
      return data ?? [];
    },
  });

  return (
    <section className="space-y-6 pb-20">
      {/* Filtros de Género */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {GENEROS.map((g) => (
          <button
            key={g.label}
            onClick={() => setActiveGenre(g.label)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
              activeGenre === g.label
                ? "bg-primary text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      {/* Grid Principal */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay contenido aún. ¡Pronto se llenará el universo! 🚀</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {books.map((book: any) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}
