import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Heart, Star, Users, Edit3, Check } from "lucide-react";
import { toast } from "sonner";

export default function UserProfileSection() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState("");

  // Fetch full profile with bio
  const { data: fullProfile } = useQuery({
    queryKey: ["fullProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
      }
      return data;
    },
    enabled: !!user,
  });

  // Favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ["myFavorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("favorites")
        .select("*, books(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Reading stats
  const { data: readingStats } = useQuery({
    queryKey: ["readingStats", user?.id],
    queryFn: async () => {
      if (!user) return { reading: 0, completed: 0, want: 0 };
      const { data } = await supabase
        .from("reading_progress")
        .select("status")
        .eq("user_id", user.id);
      const items = data || [];
      return {
        reading: items.filter((i) => i.status === "reading").length,
        completed: items.filter((i) => i.status === "completed").length,
        want: items.filter((i) => i.status === "want_to_read").length,
      };
    },
    enabled: !!user,
  });

  // Review count
  const { data: reviewCount = 0 } = useQuery({
    queryKey: ["myReviewCount", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  // Follower/following counts
  const { data: socialStats } = useQuery({
    queryKey: ["socialStats", user?.id],
    queryFn: async () => {
      if (!user) return { followers: 0, following: 0 };
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from("followers").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("followers").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      return { followers: followers || 0, following: following || 0 };
    },
    enabled: !!user,
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), bio: bio.trim() })
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["fullProfile"] });
      toast.success("Perfil actualizado");
    },
  });

  const stats = [
    { label: "Leyendo", value: readingStats?.reading ?? 0, icon: BookOpen },
    { label: "Completados", value: readingStats?.completed ?? 0, icon: Check },
    { label: "Reseñas", value: reviewCount, icon: Star },
    { label: "Seguidores", value: socialStats?.followers ?? 0, icon: Users },
  ];

  return (
    <section className="space-y-4">
      {/* Profile Card */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-start gap-4">
          <img
            src={fullProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName || "U"}`}
            alt="Avatar"
            className="w-16 h-16 rounded-full border-2 border-primary object-cover"
          />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="Tu nombre"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary resize-none h-16"
                  placeholder="Bio..."
                />
                <button
                  onClick={() => updateProfile.mutate()}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-foreground">{fullProfile?.display_name || "Usuario"}</h2>
                  <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {fullProfile?.bio && <p className="text-xs text-muted-foreground mt-1">{fullProfile.bio}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {socialStats?.followers ?? 0} seguidores · {socialStats?.following ?? 0} siguiendo
                </p>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
              <Icon className="w-4 h-4 mx-auto text-primary mb-1" />
              <p className="text-sm font-bold text-foreground">{value}</p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-400" /> Mis Favoritos
        </h3>
        {favorites.length === 0 ? (
          <div className="glass-panel p-4 text-center text-xs text-muted-foreground">
            Aún no tienes favoritos. ¡Explora el catálogo!
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {favorites.map((f: any) => (
              <div key={f.id} className="shrink-0 w-20">
                <div className="w-20 h-28 rounded-md bg-white/5 overflow-hidden">
                  {f.books?.cover_url ? (
                    <img src={f.books.cover_url} alt={f.books.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-foreground mt-1 line-clamp-2 leading-tight">{f.books?.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
