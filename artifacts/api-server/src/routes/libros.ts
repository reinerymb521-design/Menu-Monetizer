import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/libros", async (req, res) => {
  const { genero, premium, q, limit = "20" } = req.query as Record<string, string>;

  let query = supabase
    .from("libros")
    .select("id, titulo, autor, url_portada, URL_PDF, genero, es_premium")
    .limit(Math.min(Number(limit) || 20, 100));

  if (genero) query = query.eq("genero", genero);
  if (premium === "true") query = query.eq("es_premium", true);
  if (premium === "false") query = query.eq("es_premium", false);
  if (q) query = query.or(`titulo.ilike.%${q}%,autor.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    req.log.error({ err: error }, "libros query failed");
    return res.status(500).json({ error: error.message });
  }
  return res.json({ data });
});

router.get("/libros/:id", async (req, res) => {
  const { id } = req.params;

  const [libroRes, audiolibrosRes] = await Promise.all([
    supabase
      .from("libros")
      .select("id, titulo, autor, url_portada, URL_PDF, genero, es_premium")
      .eq("id", id)
      .single(),
    supabase
      .from("audiolibros")
      .select("id, titulo, audio_url")
      .eq("libro_id", id),
  ]);

  if (libroRes.error) {
    req.log.error({ err: libroRes.error }, "libro fetch failed");
    return res.status(404).json({ error: "Libro no encontrado" });
  }
  return res.json({ data: { ...libroRes.data, audiolibros: audiolibrosRes.data ?? [] } });
});

export default router;
