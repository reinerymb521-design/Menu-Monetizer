import { useAuth } from "@/hooks/useAuth";
import { Crown, BookOpen, User } from "lucide-react";

export default function UserProfileSection() {
  const { user, profile, isPremium, isAdmin } = useAuth();

  if (!user) return null;

  const displayName =
    profile?.display_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario";

  const avatarUrl =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <section className="space-y-4">
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
            <p className="text-xs font-semibold">
              {isPremium ? "Premium activo" : "Plan gratuito"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isPremium ? "Acceso completo" : "Contenido limitado"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center space-y-1">
            <BookOpen className="w-5 h-5 mx-auto text-primary" />
            <p className="text-xs font-semibold">Catálogo</p>
            <p className="text-[10px] text-muted-foreground">
              {isPremium ? "Todo el catálogo" : "Libros gratuitos"}
            </p>
          </div>
        </div>
      </div>

      {/* Account info */}
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
            <span className="text-foreground capitalize">
              {user.app_metadata?.provider || "Google"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
