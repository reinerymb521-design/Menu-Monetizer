# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## AudiVerse Artifact (`artifacts/menu-app`)

Full AudiVerse audiobook app (React + Vite + TS + Tailwind v4 + Supabase) with two added features:

1. **Settings menu** (`src/components/SettingsPanel.tsx`) — slide-out drawer with 11 sections (account, appearance, language, notifications, privacy, playback, data, security, premium, help, about) backed by `src/hooks/useSettings.tsx` (localStorage). Opened from gear icon in `AppLayout.tsx` next to Bell.
2. **PayPal premium subscription** (`src/components/VIPSection.tsx` + `src/components/PayPalSubscribeButton.tsx`) — Smart Buttons supporting recurring subscriptions (via `VITE_PAYPAL_PLAN_MONTHLY` / `VITE_PAYPAL_PLAN_YEARLY` plan IDs) or one-time orders. On approval, sets `profiles.is_premium = true` and inserts row into `subscriptions` table; emits `audiverse:profile-refresh` window event consumed by `useAuth.tsx`.

### Required env vars
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — already set
- `VITE_PAYPAL_CLIENT_ID` — currently `"test"` placeholder; replace with live client ID
- `VITE_PAYPAL_PLAN_MONTHLY`, `VITE_PAYPAL_PLAN_YEARLY` — optional; if unset, PayPal falls back to one-time order

### Pending user action
See `artifacts/menu-app/PAYPAL_SETUP.md` for the SQL to run on Supabase: adds `INSERT`/`UPDATE` RLS policies on the `subscriptions` table (currently missing) and an optional `notify_on_premium` trigger.
