import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, UserPlus, MessageCircle, Check, X } from "lucide-react";

export default function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const iconForType = (type: string) => {
    if (type === "follow") return <UserPlus className="w-4 h-4 text-primary" />;
    return <MessageCircle className="w-4 h-4 text-yellow-400" />;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm h-full bg-background border-l border-white/10 flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notificaciones
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-[10px] text-primary hover:underline">
                <Check className="w-3.5 h-3.5 inline mr-0.5" />Marcar leídas
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-white/5 flex items-start gap-3 ${
                  !n.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="mt-0.5">{iconForType(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function useUnreadCount() {
  const { user } = useAuth();
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("id, is_read")
        .eq("user_id", user.id)
        .eq("is_read", false);
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
  return notifications.length;
}
