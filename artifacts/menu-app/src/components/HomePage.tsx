import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BookCard from "./BookCard";
import { BookOpen } from "lucide-react";

const GENEROS = [
  { label: "Todos",                      emoji: "🌎" },
  { label: "Drama y Romance",            emoji: "💖" },
  { label: "Ciencia Ficción y Aventura", emoji: "🚀" },
  { label: "Terror y Suspenso",          emoji: "👻" },
];

export default function HomePage({ searchQuery }: { searchQuery: string }) {
  const [activeGenre, setActiveGenre] = useState("Todos");

  const { data: libros = [], isLoading } = useQuery({
    queryKey: ["libros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("libros")
        .select("id, titulo, autor, genero, url_portada, URL_PDF, es_premium");

      if (error) {
        console.error("[libros]", error.message);
        return [];
      }

      return data ?? [];
    },
  });

  const librosFiltrados = libros.filter((libro: any) => {
    const coincideGenero =
      activeGenre === "Todos" ||
      (libro.genero ?? "").toLowerCase().includes(activeGenre.toLowerCase());

    const coincideBusqueda =
      !searchQuery ||
      (libro.titulo ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (libro.autor ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    return coincideGenero && coincideBusqueda;
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
      ) : librosFiltrados.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {libros.length === 0
              ? "No hay contenido aún. ¡Pronto se llenará el universo! 🚀"
              : "No se encontraron libros con ese filtro."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {librosFiltrados.map((libro: any) => (
            <BookCard key={libro.id} libro={libro} />
          ))}
        </div>
      )}
    </section>
  );
}
