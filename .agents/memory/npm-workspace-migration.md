---
name: npm workspace migration
description: Constraints learned while converting this monorepo from pnpm workspaces to npm workspaces.
---

When generating an npm lockfile after migrating from pnpm, remove inherited root and nested `node_modules` trees first; otherwise npm 11 can preserve incomplete nested workspace entries and fail with an opaque `Invalid Version` error during `npm ci`.

**Why:** The previous pnpm install layout left nested workspace lock entries without package versions, which npm's Arborist could not compare.

**How to apply:** Regenerate `package-lock.json` from a clean tree, then validate with `npm ci` before relying on it in CI.

`esbuild-plugin-pino@2.3.3` currently requires `esbuild >=0.25.0 <=0.25.8`; npm's peer resolver rejects the newer esbuild line, so these versions must remain aligned unless the plugin is upgraded.

**Why:** `npm ci` enforces the plugin's peer range instead of silently accepting the mismatch.

**How to apply:** Check this peer range before upgrading the API server's esbuild dependency.