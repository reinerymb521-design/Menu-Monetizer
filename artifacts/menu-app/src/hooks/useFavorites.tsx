import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

const storageKey = (userId: string) => `audiverse_favorites_${userId}`;

export function useFavorites() {
  const { user } = useAuth();

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (!user) return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey(user.id)) ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!user) { setFavoriteIds([]); return; }
    try {
      setFavoriteIds(JSON.parse(localStorage.getItem(storageKey(user.id)) ?? "[]"));
    } catch {
      setFavoriteIds([]);
    }
  }, [user?.id]);

  const toggleFavorite = useCallback(
    (libroId: string) => {
      if (!user) return;
      setFavoriteIds((prev) => {
        const next = prev.includes(libroId)
          ? prev.filter((id) => id !== libroId)
          : [...prev, libroId];
        try { localStorage.setItem(storageKey(user.id), JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [user?.id],
  );

  const isFavorite = useCallback(
    (libroId: string) => favoriteIds.includes(libroId),
    [favoriteIds],
  );

  return { favoriteIds, toggleFavorite, isFavorite };
}
