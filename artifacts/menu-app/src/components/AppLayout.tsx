import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Home, Users, Crown, Bell, User, Settings as SettingsIcon, Shield } from "lucide-react";
import HomePage from "./HomePage";
import CommunitySection from "./CommunitySection";
import UserProfileSection from "./UserProfileSection";
import SearchBar from "./SearchBar";
import NotificationsPanel, { useUnreadCount } from "./NotificationsPanel";
import VIPSection from "./VIPSection";
import AdminPanel from "./AdminPanel";
import SettingsPanel from "./SettingsPanel";

type Section = "inicio" | "comunidad" | "vip" | "perfil" | "admin";

export default function AppLayout() {
  const { user, profile, isPremium, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>("inicio");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const unreadCount = useUnreadCount();

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  const navItems: { id: Section; icon: typeof Home; label: string; show?: boolean }[] = [
    { id: "inicio", icon: Home, label: "Inicio" },
    { id: "comunidad", icon: Users, label: "Comunidad" },
    { id: "vip", icon: Crown, label: "VIP" },
    { id: "admin", icon: Shield, label: "Admin", show: isAdmin },
    { id: "perfil", icon: User, label: "Perfil" },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative" onClick={() => setActiveSection("perfil")}>
            <img
              src={avatarUrl}
              alt="Avatar"
              className={`w-9 h-9 rounded-full border-2 object-cover cursor-pointer ${isPremium ? "border-yellow-400" : "border-primary"}`}
            />
            {isPremium && (
              <Crown className="w-3.5 h-3.5 text-yellow-400 absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight flex items-center gap-1">
              {displayName}
              {isPremium && <Crown className="w-3 h-3 text-yellow-400 inline" />}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isPremium ? "VIP Premium" : "Plan gratuito"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 transition"
            aria-label="Opciones"
          >
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Search - only on inicio */}
      {activeSection === "inicio" && (
        <div className="px-4 py-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4">
        {activeSection === "inicio" && <HomePage searchQuery={searchQuery} />}
        {activeSection === "comunidad" && <CommunitySection />}
        {activeSection === "perfil" && <UserProfileSection />}
        {activeSection === "vip" && <VIPSection />}
        {activeSection === "admin" && <AdminPanel />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-header border-t border-white/10 flex justify-around py-2 z-50">
        {navItems.filter((n) => n.show !== false).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition ${
              activeSection === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
