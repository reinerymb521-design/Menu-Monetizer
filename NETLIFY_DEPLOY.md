# Despliegue en Netlify

La configuración versionada está en `netlify.toml`, en la raíz del monorepo.
Netlify debe instalar dependencias desde la raíz para respetar el workspace de
npm y su `package-lock.json`.

## Configuración del sitio

Al conectar el repositorio con Netlify:

- **Package directory:** `artifacts/menu-app`
- **Base directory:** déjalo sin definir para que sea la raíz del repositorio
- **Build command:** `npm run build --workspace=@workspace/menu-app`
- **Publish directory:** `artifacts/menu-app/dist`
- **Node.js:** 22 (también definido en `netlify.toml`)

El comando de build y el directorio publicado ya están definidos en
`netlify.toml`. El script `build` de `artifacts/menu-app/package.json` compila
con Vite y escribe directamente en `artifacts/menu-app/dist`. Netlify detecta
`package-lock.json` en la raíz e instala el workspace npm desde allí.

## Variables de entorno

Configúralas en **Site configuration → Environment variables** de Netlify.
No las añadas al repositorio:

- `VITE_SUPABASE_URL` — requerido por el cliente de Supabase.
- `VITE_SUPABASE_ANON_KEY` — requerido por el cliente de Supabase.
- `VITE_PAYPAL_CLIENT_ID` — Client ID público de PayPal.
- `VITE_PAYPAL_PLAN_MONTHLY` — opcional; ID del plan mensual de PayPal.
- `VITE_PAYPAL_PLAN_YEARLY` — opcional; ID del plan anual de PayPal.
- `VITE_ADMOB_PUBLISHER_ID` y `VITE_ADMOB_SLOT_ID` — opcionales para AdMob.

Las variables con prefijo `VITE_` se incorporan al código del navegador durante
la compilación; no pongas secretos de servidor bajo ese prefijo. Después de
añadir o cambiar valores, vuelve a desplegar para que Vite los compile.

## Autenticación de Google

En Supabase, actualiza **Authentication → URL Configuration** para incluir el
dominio publicado de Netlify en `Site URL` y en las URL de redirección
permitidas. Mantén el callback OAuth del proveedor de Google apuntando al
callback de Supabase. Añade también los dominios de deploy preview si vas a
probar inicio de sesión en ellos.