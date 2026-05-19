import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/perfiles", async (req, res) => {
  const { limit = "20" } = req.query as Record<string, string>;

  const { data, error } = await supabase
    .from("perfiles")
    .select("id, user_id, email, avatar_url, es_premium, es_admin")
    .limit(Math.min(Number(limit) || 20, 100));

  if (error) {
    req.log.error({ err: error }, "perfiles query failed");
    return res.status(500).json({ error: error.message });
  }
  return res.json({ data });
});

router.get("/perfiles/:userId", async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from("perfiles")
    .select("id, user_id, email, avatar_url, es_premium, es_admin")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    req.log.error({ err: error }, "perfil fetch failed");
    return res.status(500).json({ error: error.message });
  }
  if (!data) return res.status(404).json({ error: "Perfil no encontrado" });
  return res.json({ data });
});

export default router;
