import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Sparkles } from "lucide-react";
import BookCard, { type Libro } from "./BookCard";

const GENRES = [
  { label: "Todos", emoji: "" },
  { label: "Horror", emoji: "👻" },
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

  const { data: libros = [], isLoading } = useQuery({
    queryKey: ["libros", activeGenre, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("libros")
        .select("id, titulo, autor, descripcion, portada_url, genero, es_premium");
      if (activeGenre !== "Todos") query = query.eq("genero", activeGenre);
      if (searchQuery)
        query = query.or(
          `titulo.ilike.%${searchQuery}%,autor.ilike.%${searchQuery}%`,
        );
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Libro[];
    },
  });

  const { librosGratis, librosPremium } = useMemo(() => {
    const gratis = libros.filter((b) => !b.es_premium);
    const premium = libros.filter((b) => b.es_premium);
    return { librosGratis: gratis, librosPremium: premium };
  }, [libros]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Descubre</h2>
        <p className="text-sm text-muted-foreground">
          Contenido reciente para ti
        </p>
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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="loader-spinner" />
        </div>
      ) : libros.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <p className="text-sm">
            No hay contenido aún. ¡Pronto se llenará el universo! 🌌
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Contenido Gratuito */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Contenido Gratuito
              </h3>
              <span className="text-xs text-muted-foreground">
                {librosGratis.length}{" "}
                {librosGratis.length === 1 ? "título" : "títulos"}
              </span>
            </div>
            {librosGratis.length === 0 ? (
              <div className="glass-panel p-6 text-center text-muted-foreground">
                <p className="text-sm">No hay títulos gratuitos en esta categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {librosGratis.map((libro) => (
                  <BookCard key={libro.id} book={libro} />
                ))}
              </div>
            )}
          </div>

          {/* Premium */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  Premium
                </span>
              </h3>
              <span className="text-xs text-muted-foreground">
                {librosPremium.length}{" "}
                {librosPremium.length === 1 ? "título" : "títulos"}
              </span>
            </div>
            {librosPremium.length === 0 ? (
              <div className="glass-panel p-6 text-center text-muted-foreground">
                <p className="text-sm">Aún no hay títulos premium en esta categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {librosPremium.map((libro) => (
                  <BookCard key={libro.id} book={libro} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
