---
name: AudiVerse data compatibility
description: Durable guidance for extending AudiVerse's mixed Supabase schema safely.
---

AudiVerse has legacy schema variants in circulation: the product UI uses Spanish table/column names such as `perfiles`, `libros`, `correo_electronico`, and `es_admin`, while older migrations also define English tables such as `profiles`, `books`, and `user_roles`.

**Why:** Existing authentication and admin behavior has previously failed when a feature assumed only one schema variant, and hardcoded email access weakened the admin boundary.

**How to apply:** Extend the Spanish tables used by the current UI when adding product features, use compatibility fallbacks where identifiers differ, and enforce privileged actions with Supabase RLS/roles rather than email allowlists.

For especially sensitive admin surfaces, keep Google authentication and the database admin role as the first gate, then verify a separately stored password hash through a Supabase `SECURITY DEFINER` RPC; never ship the password or its hash to Vite client code.

**Why:** A second bridge protects the admin console even when a valid Google session is already open, without turning a frontend environment variable into a recoverable secret.

**How to apply:** Provision the hash in Supabase SQL, grant the verification RPC only to authenticated users, and let the client consume only its boolean result.