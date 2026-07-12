import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Crown, BookOpen, User, Heart, Book, Headphones } from "lucide-react";
import BookDetailModal from "./BookDetailModal";
import { useState } from "react";
import type { Libro } from "./BookCard";

export default function UserProfileSection() {
  const { user, profile, isPremium, isAdmin } = useAuth();
  const { favoriteIds } = useFavorites();
  const [selectedBook, setSelectedBook] = useState<Libro | null>(null);

  const displayName =
    profile?.display_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario";

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  const { data: favBooks = [] } = useQuery({
    queryKey: ["favoritos", favoriteIds],
    queryFn: async () => {
      if (favoriteIds.length === 0) return [];
      const { data } = await supabase
        .from("libros")
        .select("id, titulo, autor, genero, url_portada, URL_PDF, es_premium")
        .in("id", favoriteIds);
      return (data ?? []) as Libro[];
    },
    enabled: favoriteIds.length > 0,
  });

  if (!user) return null;

  return (
    <section className="space-y-4 pb-20">
      {/* Profile Card */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-start gap-4">
          <img
            src={avatarUrl}
            alt="Avatar"
            className={`w-16 h-16 rounded-full border-2 object-cover ${isPremium ? "border-yellow-400" : "border-primary"}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-foreground">{displayName}</h2>
              {isPremium && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 font-semibold">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                  Admin
                </span>
              )}
            </div>
            {user.email && (
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center space-y-1">
            <Crown className={`w-5 h-5 mx-auto ${isPremium ? "text-yellow-400" : "text-muted-foreground"}`} />
            <p className="text-xs font-semibold">{isPremium ? "Premium activo" : "Plan gratuito"}</p>
            <p className="text-[10px] text-muted-foreground">{isPremium ? "Acceso completo" : "Contenido limitado"}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center space-y-1">
            <Heart className="w-5 h-5 mx-auto text-red-400" />
            <p className="text-xs font-semibold">{favoriteIds.length} favorito{favoriteIds.length !== 1 ? "s" : ""}</p>
            <p className="text-[10px] text-muted-foreground">Libros guardados</p>
          </div>
        </div>
      </div>

      {/* Cuenta */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Cuenta
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground truncate max-w-[180px]">{user.email}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Plan</span>
            <span className={isPremium ? "text-yellow-400 font-semibold" : "text-foreground"}>
              {isPremium ? "VIP Premium" : "Gratuito"}
            </span>
          </div>
          {isAdmin && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Rol</span>
              <span className="text-primary font-semibold">Administrador</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Proveedor</span>
            <span className="text-foreground capitalize">{user.app_metadata?.provider || "Google"}</span>
          </div>
        </div>
      </div>

      {/* Favoritos */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-400" /> Mis favoritos
        </h3>

        {favoriteIds.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Aún no tienes favoritos.<br />Toca el ❤️ en cualquier libro para guardarlo.</p>
          </div>
        ) : favBooks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {favBooks.map((libro) => (
              <button
                key={libro.id}
                onClick={() => setSelectedBook(libro)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition text-left"
              >
                <div className="w-10 h-14 rounded-md bg-white/5 overflow-hidden shrink-0">
                  {libro.url_portada ? (
                    <img src={libro.url_portada} alt={libro.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <Book className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold line-clamp-2 text-foreground">{libro.titulo}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{libro.autor}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {libro.URL_PDF
                      ? <><Book className="w-2.5 h-2.5 text-red-400" /><span className="text-[9px] text-red-400">PDF</span></>
                      : <><Headphones className="w-2.5 h-2.5 text-primary" /><span className="text-[9px] text-primary">Audio</span></>
                    }
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBook && (
        <BookDetailModal libro={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </section>
  );
}
