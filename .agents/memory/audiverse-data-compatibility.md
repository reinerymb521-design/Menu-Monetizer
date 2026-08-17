---
name: AudiVerse data compatibility
description: Durable guidance for extending AudiVerse's mixed Supabase schema safely.
---

AudiVerse has legacy schema variants in circulation: the product UI uses Spanish table/column names such as `perfiles`, `libros`, `correo_electronico`, and `es_admin`, while older migrations also define English tables such as `profiles`, `books`, and `user_roles`.

**Why:** Existing authentication and admin behavior has previously failed when a feature assumed only one schema variant, and hardcoded email access weakened the admin boundary.

**How to apply:** Extend the Spanish tables used by the current UI when adding product features, use compatibility fallbacks where identifiers differ, and enforce privileged actions with Supabase RLS/roles rather than email allowlists.