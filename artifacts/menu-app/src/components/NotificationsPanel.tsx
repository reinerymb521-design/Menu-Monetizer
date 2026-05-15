import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, X, MessageCircle } from "lucide-react";

export default function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notificaciones = [] } = useQuery({
    queryKey: ["notificaciones", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notificaciones")
        .select("id, titulo, mensaje, leida")
        .order("id", { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = notificaciones.filter((n) => !n.leida).map((n) => n.id);
      if (!ids.length) return;
      await supabase
        .from("notificaciones")
        .update({ leida: true })
        .in("id", ids);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificaciones"] }),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notificaciones-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones" },
        () => {
          qc.invalidateQueries({ queryKey: ["notificaciones"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm h-full bg-background border-l border-white/10 flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notificaciones
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[10px] text-primary hover:underline"
              >
                <Check className="w-3.5 h-3.5 inline mr-0.5" />
                Marcar leídas
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notificaciones.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-white/5 flex items-start gap-3 ${
                  !n.leida ? "bg-primary/5" : ""
                }`}
              >
                <div className="mt-0.5">
                  <MessageCircle className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {n.titulo}
                  </p>
                  {n.mensaje && (
                    <p className="text-xs text-muted-foreground">{n.mensaje}</p>
                  )}
                </div>
                {!n.leida && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                )}
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
  const { data: notificaciones = [] } = useQuery({
    queryKey: ["notificaciones", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notificaciones")
        .select("id, leida")
        .eq("leida", false);
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
  return notificaciones.length;
}
