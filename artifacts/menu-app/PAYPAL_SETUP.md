# Configuración de AudiVerse (Login con Google + PayPal)

Esta guía cubre los **tres pasos** que faltan para dejar la app 100% lista:

1. Configurar **Google** como proveedor de login en Supabase.
2. Ejecutar un pequeño SQL en Supabase (políticas para suscripciones).
3. Configurar tu **PayPal Client ID** real (y opcionalmente Plan IDs).

---

## 1. Activar Google Login en Supabase

AudiVerse ahora **solo permite el ingreso con cuenta de Google** (no se
almacenan contraseñas de los usuarios). Para que funcione necesitas:

### a) Activar el proveedor Google

1. Entra a https://supabase.com/dashboard → tu proyecto.
2. **Authentication → Providers → Google**.
3. Activa el toggle. Pega tu **Client ID** y **Client Secret** de Google Cloud
   (los obtienes en https://console.cloud.google.com/apis/credentials, creando
   credenciales de tipo "OAuth client ID → Web application").
4. En Google Cloud, en la sección **Authorized redirect URIs**, pega:

   ```
   https://saoezmlymxcafqszzjef.supabase.co/auth/v1/callback
   ```

5. Guarda en Supabase.

### b) Agregar tus URLs a la lista permitida

En Supabase → **Authentication → URL Configuration**:

- **Site URL:** la URL de tu app publicada (cuando deploys, será algo como
  `https://audiverse-xxx.replit.app`). Por ahora puedes poner la del entorno de
  desarrollo de Replit.
- **Redirect URLs (Additional):** agrega ambas, una por línea:
  - URL del entorno de desarrollo (la que ves en la barra del preview).
  - URL de producción `https://audiverse-xxx.replit.app/`.

> Si no agregas la URL aquí, después de iniciar sesión con Google la página
> redirige pero Supabase rechaza el callback y vuelves a la pantalla de login.

---

## 2. SQL a ejecutar en Supabase

Tu tabla `public.subscriptions` ya existe pero **no tiene política `INSERT`**,
así que cuando un usuario paga Supabase rechaza el registro de su suscripción.

Abre **SQL Editor → New query** y pega:

```sql
-- Permitir que cada usuario registre su propia suscripción
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permitir que cada usuario actualice/cancele su suscripción
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- (Opcional) Notificación automática al hacerse VIP
CREATE OR REPLACE FUNCTION public.notify_on_premium()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_premium = true AND COALESCE(OLD.is_premium, false) = false THEN
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.user_id,
      'premium',
      '¡Bienvenido a Carnet Dorado!',
      'Tu suscripción VIP está activa. Disfruta de toda la biblioteca premium.'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_premium ON public.profiles;
CREATE TRIGGER trg_notify_on_premium
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_on_premium();
```

Ejecuta (botón **Run**). Listo.

---

## 3. Configurar PayPal

### a) Crear (o ver) tu Client ID

1. Entra a https://developer.paypal.com/dashboard/applications
2. Pestaña **Live** (no Sandbox) → **Create App** → tipo **Merchant**.
3. Copia el **Client ID**. Es público y va en el frontend.
4. El dinero llegará automáticamente a la cuenta PayPal con la que crees la app
   (la del administrador).

### b) (Opcional) Crear Planes de suscripción recurrente

Si quieres **suscripciones recurrentes** (PayPal cobra cada mes/año
automáticamente):

1. En el dashboard PayPal → **Pay & Get Paid → Subscriptions → Plans → Create**.
2. Crea 2 planes:
   - **Mensual:** USD 4.99 / mes → guarda el `Plan ID` (empieza por `P-`).
   - **Anual:** USD 39.99 / año → guarda el `Plan ID`.

> Si **no** creas planes, AudiVerse usará automáticamente un **pago único** por
> el período (un solo cobro). Sigue funcionando perfectamente.

### c) Configurar las variables en Replit

En el panel **Secrets** de Replit (icono del candado) agrega:

| Variable                   | Valor                                                |
| -------------------------- | ---------------------------------------------------- |
| `VITE_PAYPAL_CLIENT_ID`    | El Client ID de tu app PayPal Live                   |
| `VITE_PAYPAL_PLAN_MONTHLY` | (Opcional) Plan ID del plan mensual `P-XXXXXXXX`     |
| `VITE_PAYPAL_PLAN_YEARLY`  | (Opcional) Plan ID del plan anual `P-XXXXXXXX`       |

> Ya está creada `VITE_PAYPAL_CLIENT_ID` con el valor `test` para probar la
> interfaz. Cuando la cambies por tu Client ID real y reinicies la app, los
> botones de PayPal harán cobros reales a la cuenta del administrador.

---

## ¿Qué pasa cuando alguien paga?

1. El usuario hace clic en el botón amarillo de PayPal en la sección **VIP**.
2. PayPal muestra su ventana segura de pago.
3. Al aprobar:
   - `profiles.is_premium = true` (queda VIP).
   - Se inserta una fila en `subscriptions` con `payment_provider = 'paypal'`,
     el `provider_subscription_id` (id de PayPal) y las fechas del periodo.
   - Si activaste el trigger opcional, le llega una notificación de bienvenida.
4. Su corona dorada aparece en el header, y la sección VIP cambia a "¡Eres VIP!"
   mostrando los datos de su suscripción.

Los pagos van **directamente a tu cuenta PayPal** (la del administrador que
creó el Client ID).
