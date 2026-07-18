import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Crown, BookOpen, User, Heart, Book, Headphones,
  ImageIcon, X as XIcon, Map,
} from "lucide-react";
import BookDetailModal from "./BookDetailModal";
import type { Libro } from "./BookCard";

interface Props {
  onGoToCatalog?: () => void;
}

export default function UserProfileSection({ onGoToCatalog }: Props) {
  const { user, profile, isPremium, isAdmin } = useAuth();
  const { favoriteIds } = useFavorites();
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState<Libro | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bgImage, setBgImage] = useState<string | null>(() =>
    localStorage.getItem("audiverse_profile_bg"),
  );

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Usuario";

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

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      localStorage.setItem("audiverse_profile_bg", url);
      setBgImage(url);
    };
    reader.readAsDataURL(file);
  };

  const removeBg = () => {
    localStorage.removeItem("audiverse_profile_bg");
    setBgImage(null);
  };

  if (!user) return null;

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <section className="relative -mx-4 min-h-[calc(100vh-8rem)]">
      {/* ── Background ── */}
      {bgImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg,#1e1040 0%,#2d1b69 40%,#0f172a 100%)" }}
        />
      )}
      {/* overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* ── Contenido ── */}
      <div className="relative z-10 p-4 pb-24 space-y-3">

        {/* Título + botón cambiar fondo */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white drop-shadow">Tu Perfil</h2>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-white/15 text-white/90 hover:bg-white/25 transition backdrop-blur-sm border border-white/20"
            >
              <ImageIcon className="w-3 h-3" /> Fondo
            </button>
            {bgImage && (
              <button
                onClick={removeBg}
                className="p-1.5 rounded-full bg-white/15 text-white/70 hover:bg-white/25 transition backdrop-blur-sm border border-white/20"
              >
                <XIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleBgUpload}
        />

        {/* ── Grid principal ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* ── Columna izquierda: Avatar + Favoritos ── */}
          <div
            className="rounded-2xl p-4 space-y-3 flex flex-col"
            style={{
              background: "rgba(255,255,255,0.13)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={`w-14 h-14 rounded-full overflow-hidden border-2 ${isPremium ? "border-yellow-400" : "border-white/40"}`}
              >
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight flex items-center gap-1 justify-center flex-wrap">
                  {displayName}
                  {isPremium && <Crown className="w-3 h-3 text-yellow-400" />}
                </p>
                {user.email && (
                  <p className="text-[10px] text-white/60 truncate max-w-[110px]">{user.email}</p>
                )}
                {isAdmin && (
                  <span className="inline-block text-[9px] px-1.5 py-0.5 rounded-full bg-primary/30 text-primary font-semibold mt-0.5">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Favoritos / "Usuarios suscritos" */}
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2">
                Mis favoritos
              </p>
              {favoriteIds.length === 0 ? (
                <div className="py-3 text-center text-white/40">
                  <Heart className="w-6 h-6 mx-auto mb-1 opacity-40" />
                  <p className="text-[10px]">Sin favoritos aún</p>
                </div>
              ) : favBooks.length === 0 ? (
                <p className="text-[10px] text-white/40 text-center py-2">Cargando...</p>
              ) : (
                <div className="space-y-1.5">
                  {favBooks.slice(0, 4).map((libro) => (
                    <button
                      key={libro.id}
                      onClick={() => setSelectedBook(libro)}
                      className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition text-left"
                    >
                      <div className="w-8 h-10 rounded-md overflow-hidden shrink-0 bg-white/10">
                        {libro.url_portada ? (
                          <img src={libro.url_portada} alt={libro.titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Book className="w-3 h-3 text-white/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold line-clamp-2 text-white/90">{libro.titulo}</p>
                        <p className="text-[9px] text-white/50 truncate">{libro.autor}</p>
                      </div>
                    </button>
                  ))}
                  {favBooks.length > 4 && (
                    <p className="text-[9px] text-white/40 text-center">+{favBooks.length - 4} más</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: cards ── */}
          <div className="space-y-3">

            {/* Plan */}
            <div
              className="rounded-2xl p-3 text-center"
              style={{
                background: "rgba(255,255,255,0.13)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Crown className={`w-6 h-6 mx-auto mb-1 ${isPremium ? "text-yellow-400" : "text-white/50"}`} />
              <p className="text-xs font-semibold text-white">
                {isPremium ? "VIP Premium" : "Plan Gratuito"}
              </p>
              <p className="text-[9px] text-white/50 mt-0.5">
                {isPremium ? "Acceso completo" : "Contenido limitado"}
              </p>
            </div>

            {/* Catálogo */}
            <button
              onClick={onGoToCatalog}
              className="w-full rounded-2xl p-3 text-center transition hover:bg-white/20"
              style={{
                background: "rgba(255,255,255,0.13)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Map className="w-6 h-6 mx-auto mb-1 text-primary/80" />
              <p className="text-xs font-semibold text-white">Catálogo</p>
              <p className="text-[9px] text-white/50 mt-0.5">Ver todos los libros</p>
            </button>

            {/* Cuenta */}
            <div
              className="rounded-2xl p-3 space-y-1.5"
              style={{
                background: "rgba(255,255,255,0.13)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <p className="text-[10px] font-bold text-white/80 mb-2">Cuenta</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50 truncate">{user.email?.split("@")[0]}</span>
                  <span className="text-white/50">@{user.email?.split("@")[1]}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50">Plan</span>
                  <span className={isPremium ? "text-yellow-400 font-semibold" : "text-white/80"}>
                    {isPremium ? "Premium" : "Gratuito"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50">Proveedor</span>
                  <span className="text-white/80 capitalize">
                    {user.app_metadata?.provider || "Google"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Botón Reproductor ── */}
        <button
          onClick={() => navigate("/listen/demo")}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.7) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(139,92,246,0.5)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
            color: "#fff",
          }}
        >
          <Headphones className="w-5 h-5" />
          Abrir Reproductor
          {favoriteIds.length > 0 && (
            <span className="text-xs opacity-70">· {favoriteIds.length} favorito{favoriteIds.length !== 1 ? "s" : ""}</span>
          )}
        </button>

      </div>

      {selectedBook && (
        <BookDetailModal libro={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </section>
  );
}
