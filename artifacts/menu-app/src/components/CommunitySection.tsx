import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Star, UserPlus, UserMinus, Search, Crown } from "lucide-react";
import { toast } from "sonner";

export default function CommunitySection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchUser, setSearchUser] = useState("");

  // Recent reviews (global feed)
  const { data: recentReviews = [] } = useQuery({
    queryKey: ["communityReviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, books(title, author, cover_url)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Profiles to discover
  const { data: profiles = [] } = useQuery({
    queryKey: ["discoverProfiles", searchUser],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("is_premium", { ascending: false })
        .order("follower_count", { ascending: false })
        .limit(10);
      if (searchUser.trim()) {
        query = query.ilike("display_name", `%${searchUser}%`);
      }
      if (user) {
        query = query.neq("user_id", user.id);
      }
      const { data } = await query;
      return data || [];
    },
  });

  // My following list
  const { data: following = [] } = useQuery({
    queryKey: ["myFollowing", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", user.id);
      return (data || []).map((f) => f.following_id);
    },
    enabled: !!user,
  });

  const toggleFollow = useMutation({
    mutationFn: async (targetId: string) => {
      if (!user) return;
      const isFollowing = following.includes(targetId);
      if (isFollowing) {
        await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", targetId);
      } else {
        await supabase.from("followers").insert({ follower_id: user.id, following_id: targetId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myFollowing"] });
      qc.invalidateQueries({ queryKey: ["discoverProfiles"] });
      qc.invalidateQueries({ queryKey: ["socialStats"] });
    },
    onError: () => toast.error("Error al actualizar seguimiento"),
  });

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Comunidad</h2>
        <p className="text-sm text-muted-foreground">Descubre lectores y reseñas</p>
      </div>

      {/* Search users */}
      <div className="glass-panel flex items-center gap-2 px-4 py-2.5">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Buscar lectores..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {/* Discover Profiles */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Lectores destacados</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {profiles.map((p) => {
            const isFollowing = following.includes(p.user_id);
            return (
              <div key={p.id} className="glass-panel shrink-0 w-28 p-3 text-center space-y-2">
                <img
                  src={p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.display_name || "U"}`}
                  alt={p.display_name || ""}
                  className="w-10 h-10 rounded-full mx-auto border border-primary/30 object-cover"
                />
                <p className="text-xs font-medium text-foreground line-clamp-1 flex items-center justify-center gap-0.5">
                  {p.display_name || "Usuario"}
                  {p.is_premium && <Crown className="w-3 h-3 text-yellow-400" />}
                </p>
                <p className="text-[10px] text-muted-foreground">{p.follower_count} seguidores</p>
                {user && (
                  <button
                    onClick={() => toggleFollow.mutate(p.user_id)}
                    className={`w-full flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-medium transition ${
                      isFollowing
                        ? "bg-white/10 text-muted-foreground"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {isFollowing ? <UserMinus className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                    {isFollowing ? "Dejar" : "Seguir"}
                  </button>
                )}
              </div>
            );
          })}
          {profiles.length === 0 && (
            <div className="glass-panel p-4 w-full text-center text-xs text-muted-foreground">
              No se encontraron lectores
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed - Recent Reviews */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Actividad reciente
        </h3>
        {recentReviews.length === 0 ? (
          <div className="glass-panel p-6 text-center text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay reseñas aún. ¡Sé el primero en opinar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentReviews.map((r: any) => (
              <div key={r.id} className="glass-panel p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {r.books?.cover_url && (
                    <img src={r.books.cover_url} alt="" className="w-10 h-14 rounded-md object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{r.books?.title}</p>
                    <p className="text-[10px] text-muted-foreground">{r.books?.author}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                {r.content && <p className="text-sm text-foreground">{r.content}</p>}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("es")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
