import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/perfiles", async (req, res) => {
  const { limit = "20" } = req.query as Record<string, string>;

  const { data, error } = await supabase
    .from("perfiles")
    .select("id, email, avatar_url, es_premium, es_admin")
    .limit(Math.min(Number(limit) || 20, 100));

  if (error) {
    req.log.error({ err: error }, "perfiles query failed");
    return res.status(500).json({ error: error.message });
  }
  return res.json({ data });
});

router.get("/perfiles/:id", async (req, res) => {
  const { id } = req.params;
  console.log("INTENTANDO BUSCAR USUARIO CON ID:", id); // Esto saldrá en tu consola de Replit

  const { data, error } = await supabase
    .from('perfiles')
    .select('*') // Pedimos todo para no fallar por nombres de columnas
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error("ERROR DE SUPABASE:", error);
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    console.log("NO SE ENCONTRÓ EL PERFIL PARA EL ID:", id);
    return res.status(404).json({ error: "Perfil no encontrado" });
  }

  console.log("PERFIL ENCONTRADO CON ÉXITO:", data);
  return res.json(data);
});

export default router;