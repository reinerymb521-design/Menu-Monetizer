/**
 * Bucket IDs are case-sensitive and must match Supabase exactly.
 * Keep these values in one place so upload callers cannot drift.
 */
export const STORAGE_BUCKETS = {
  portada: "portada",
  socialPosts: "Sosial posts",
  libros: "Libros",
  audios: "audios",
  publico: "publico",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];