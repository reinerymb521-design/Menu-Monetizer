import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Crown, Heart, Book, Headphones,
  ImageIcon, X as XIcon, Map, Lock, Camera,
} from "lucide-react";
import BookDetailModal from "./BookDetailModal";
import type { Libro } from "./BookCard";
import { toast } from "sonner";

interface Props {
  onGoToCatalog?: () => void;
  onGoToVip?: () => void;
}

/* ── Glass card style reutilizable ── */
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

export default function UserProfileSection({ onGoToCatalog, onGoToVip }: Props) {
  const { user, profile, isPremium, isAdmin } = useAuth();
  const { favoriteIds } = useFavorites();
  const navigate = useNavigate();

  const [selectedBook, setSelectedBook] = useState<Libro | null>(null);

  /* ── Fondo de pantalla (solo premium) ── */
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [bgImage, setBgImage] = useState<string | null>(() =>
    localStorage.getItem("audiverse_profile_bg"),
  );

  /* ── Foto de perfil ── */
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [localAvatar, setLocalAvatar] = useState<string | null>(() =>
    localStorage.getItem("audiverse_avatar_local"),
  );

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const avatarUrl =
    localAvatar ||
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  /* ── Query favoritos ── */
  const { data: favBooks = [] } = useQuery({
    queryKey: ["favoritos", favoriteIds],
    queryFn: async () => {
      if (favoriteIds.length === 0) return [];
      const { data } = await supabase
        .from("libros")
        .select("id, titulo, autor, genero, url_portada, URL_PDF, es_premium")
        .in("id", favoriteIds);
      return (data ?? []) as any as Libro[];
    },
    enabled: favoriteIds.length > 0,
  });

  /* ── Handlers ── */
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      localStorage.setItem("audiverse_profile_bg", url);
      setBgImage(url);
      toast.success("Fondo de perfil actualizado");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      localStorage.setItem("audiverse_avatar_local", url);
      setLocalAvatar(url);
      toast.success("Foto de perfil actualizada");
    };
    reader.readAsDataURL(file);
  };

  const removeBg = () => {
    localStorage.removeItem("audiverse_profile_bg");
    setBgImage(null);
  };

  /* Botón bloqueado: muestra candado y lleva al VIP */
  const PremiumGate = ({ label, icon: Icon }: { label: string; icon: any }) => (
    <button
      onClick={() => { toast("Función exclusiva VIP 👑"); onGoToVip?.(); }}
      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-300/80 hover:bg-yellow-400/20 transition backdrop-blur-sm"
    >
      <Lock className="w-3 h-3" />
      {label}
      <Crown className="w-3 h-3 text-yellow-400" />
    </button>
  );

  if (!user) return null;

  return (
    <section className="relative -mx-4 min-h-[calc(100vh-8rem)]">

      {/* ── Background ── */}
      {bgImage ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
      ) : (
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#1e1040 0%,#2d1b69 40%,#0f172a 100%)" }} />
      )}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* ── Contenido ── */}
      <div className="relative z-10 p-4 pb-28 space-y-3">

        {/* Cabecera: título + botones fondo */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white drop-shadow">Tu Perfil</h2>
          <div className="flex gap-2">
            {isPremium ? (
              <>
                <button
                  onClick={() => bgInputRef.current?.click()}
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
              </>
            ) : (
              <PremiumGate label="Fondo" icon={ImageIcon} />
            )}
          </div>
        </div>

        {/* Inputs ocultos */}
        <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

        {/* ── Grid: columna izquierda + derecha ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Columna izquierda: Avatar + Favoritos */}
          <div className="rounded-2xl p-4 space-y-3 flex flex-col" style={glass}>

            {/* Avatar con botón cámara */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative">
                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${isPremium ? "border-yellow-400" : "border-white/40"}`}>
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                {/* Botón cambiar foto — siempre disponible */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white/20 hover:bg-white/30 transition"
                  style={{ background: "rgba(0,0,0,0.7)" }}
                  title="Cambiar foto"
                >
                  <Camera className="w-3 h-3 text-white" />
                </button>
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

            {/* Lista de favoritos */}
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide mb-2">Mis favoritos</p>
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
                        {libro.url_portada
                          ? <img src={libro.url_portada} alt={libro.titulo} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Book className="w-3 h-3 text-white/30" /></div>}
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

          {/* Columna derecha: cards */}
          <div className="space-y-3">
            {/* Plan */}
            <div className="rounded-2xl p-3 text-center" style={glass}>
              <Crown className={`w-6 h-6 mx-auto mb-1 ${isPremium ? "text-yellow-400" : "text-white/50"}`} />
              <p className="text-xs font-semibold text-white">{isPremium ? "VIP Premium" : "Plan Gratuito"}</p>
              <p className="text-[9px] text-white/50 mt-0.5">{isPremium ? "Acceso completo" : "Contenido limitado"}</p>
              {!isPremium && (
                <button
                  onClick={onGoToVip}
                  className="mt-2 text-[9px] px-2 py-1 rounded-full font-semibold"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000" }}
                >
                  Ser VIP
                </button>
              )}
            </div>

            {/* Catálogo */}
            <button
              onClick={onGoToCatalog}
              className="w-full rounded-2xl p-3 text-center transition hover:bg-white/20"
              style={glass}
            >
              <Map className="w-6 h-6 mx-auto mb-1 text-primary/80" />
              <p className="text-xs font-semibold text-white">Catálogo</p>
              <p className="text-[9px] text-white/50 mt-0.5">Ver todos los libros</p>
            </button>

            {/* Cuenta */}
            <div className="rounded-2xl p-3 space-y-1.5" style={glass}>
              <p className="text-[10px] font-bold text-white/80 mb-2">Cuenta</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50">Plan</span>
                  <span className={isPremium ? "text-yellow-400 font-semibold" : "text-white/80"}>
                    {isPremium ? "Premium" : "Gratuito"}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50">Proveedor</span>
                  <span className="text-white/80 capitalize">{user.app_metadata?.provider || "Google"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Carrusel de favoritos ── */}
        {favBooks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/70 px-1">
              🎵 Mi biblioteca — {favBooks.length} libro{favBooks.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {favBooks.map((libro) => (
                <button
                  key={libro.id}
                  onClick={() => setSelectedBook(libro)}
                  className="shrink-0 flex flex-col gap-1.5 hover:opacity-80 transition text-left"
                  style={{ width: "88px" }}
                >
                  <div
                    className="w-full rounded-xl overflow-hidden"
                    style={{ aspectRatio: "2/3", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    {libro.url_portada ? (
                      <img src={libro.url_portada} alt={libro.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Book className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-semibold text-white/85 line-clamp-2 leading-tight px-0.5">{libro.titulo}</p>
                  <p className="text-[9px] text-white/40 truncate px-0.5">{libro.autor}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Botón Reproductor (solo premium) ── */}
        {isPremium ? (
          <button
            onClick={() => navigate("/listen/demo")}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg,rgba(99,102,241,0.8),rgba(139,92,246,0.8))",
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
        ) : (
          <button
            onClick={() => { toast("El reproductor es una función VIP 🎧"); onGoToVip?.(); }}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition hover:opacity-90"
            style={{
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <Lock className="w-4 h-4 text-yellow-400/70" />
            Reproductor
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000" }}>
              VIP
            </span>
          </button>
        )}

      </div>

      {selectedBook && (
        <BookDetailModal libro={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </section>
  );
}
