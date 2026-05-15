import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Crown, BookOpen } from "lucide-react";

export default function CommunitySection() {
  const { user } = useAuth();

  const { data: perfiles = [] } = useQuery({
    queryKey: ["comunidadPerfiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("perfiles")
        .select("id, user_id, email, avatar_url, es_premium")
        .limit(20);
      return data || [];
    },
  });

  const { data: libros = [] } = useQuery({
    queryKey: ["comunidadLibros"],
    queryFn: async () => {
      const { data } = await supabase
        .from("libros")
        .select("id, titulo, autor, portada_url, es_premium")
        .eq("es_premium", false)
        .limit(6);
      return data || [];
    },
  });

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Comunidad</h2>
        <p className="text-sm text-muted-foreground">Lectores y catálogo de AudiVerse</p>
      </div>

      {/* Lectores */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Lectores registrados
        </h3>
        {perfiles.length === 0 ? (
          <div className="glass-panel p-4 text-center text-xs text-muted-foreground">
            Aún no hay lectores registrados
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {perfiles.map((p) => {
              const nombre = p.email?.split("@")[0] || "Usuario";
              return (
                <div key={p.id} className="glass-panel shrink-0 w-24 p-3 text-center space-y-2">
                  <img
                    src={p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nombre)}`}
                    alt={nombre}
                    className="w-10 h-10 rounded-full mx-auto border border-primary/30 object-cover"
                  />
                  <p className="text-xs font-medium text-foreground line-clamp-1 flex items-center justify-center gap-0.5">
                    {nombre}
                    {p.es_premium && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Catálogo gratuito */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Recomendados gratuitos
        </h3>
        {libros.length === 0 ? (
          <div className="glass-panel p-6 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">El catálogo está vacío. ¡Pronto habrá contenido!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {libros.map((libro) => (
              <div key={libro.id} className="glass-panel p-4 flex items-start gap-3">
                {libro.portada_url ? (
                  <img src={libro.portada_url} alt="" className="w-10 h-14 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-14 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{libro.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">{libro.autor}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
