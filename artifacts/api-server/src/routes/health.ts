import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let supabaseStatus: "ok" | "error" = "error";
  let supabaseDetail: string | undefined;

  try {
    const { error } = await supabase.from("libros").select("id").limit(1);
    if (error) {
      supabaseDetail = error.message;
    } else {
      supabaseStatus = "ok";
    }
  } catch (err: any) {
    supabaseDetail = err?.message ?? "unknown error";
  }

  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({
    ...data,
    supabase: supabaseStatus,
    ...(supabaseDetail ? { supabaseDetail } : {}),
  });
});

export default router;
