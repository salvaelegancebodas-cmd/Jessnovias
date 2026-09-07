[README.md](https://github.com/user-attachments/files/31904818/README.md)
# Jess Novias Makeup — plataforma web + reservas

Estado de este entregable: **fase 1 — arquitectura y motor de reservas/Calendar funcionales**.
El frontend editorial (hero, galería, secciones de marca) es la siguiente fase; aquí está
la parte técnicamente crítica: base de datos, disponibilidad anti-doble-reserva e
integración real con Google Calendar.

## 1. Instalación

```bash
npm install
cp .env.example .env
```

## 2. Base de datos (PostgreSQL)

Recomendado para desplegar en Vercel: [Neon](https://neon.tech) o [Supabase](https://supabase.com) (plan gratuito válido para empezar).

1. Crea la base de datos y copia la connection string a `DATABASE_URL` en `.env`.
2. Ejecuta las migraciones:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 3. Google Cloud — Calendar API + OAuth (paso a paso)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) y crea un proyecto nuevo (ej. "Jess Novias Makeup").
2. En **APIs y servicios → Biblioteca**, activa **Google Calendar API**.
3. En **APIs y servicios → Pantalla de consentimiento OAuth**:
   - Tipo de usuario: Externo (o Interno si Jessica usa Google Workspace).
   - Rellena nombre de la app, email de soporte y logo.
   - En "Scopes" añade `.../auth/calendar`.
   - Añade el email de Jessica como usuario de prueba mientras la app no esté verificada por Google.
4. En **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: "Jess Novias Makeup — Web".
   - **URI de redirección autorizados** (deben coincidir EXACTAMENTE con `GOOGLE_REDIRECT_URI`):
     - Desarrollo: `http://localhost:3000/api/google/callback`
     - Producción: `https://TU-DOMINIO.com/api/google/callback`
5. Copia el **Client ID** y **Client Secret** a `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
6. Genera la clave de cifrado del refresh token:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Pégala en `ENCRYPTION_KEY`.

### Conectar la cuenta de Jessica

Una vez la app esté corriendo y con sesión de admin iniciada:

1. Ir a `/admin/configuracion`.
2. Pulsar "Conectar Google Calendar" → redirige a `/api/google/connect`.
3. Autorizar con la cuenta de Google de Jessica.
4. Google redirige a `/api/google/callback`, que guarda el refresh token **cifrado** en `CalendarConnection`.
5. El estado pasará a mostrar 🟢 "Google Calendar conectado".

**Importante:** si Jessica alguna vez revoca el acceso en
[myaccount.google.com/permissions](https://myaccount.google.com/permissions), habrá que
repetir el flujo de conexión — el `prompt=consent` ya está forzado en el código para que
Google reemita siempre un `refresh_token` nuevo.

## 4. Email transaccional

Elige una opción en `.env`:

- **Resend** (recomendado, más simple): crea cuenta en resend.com, copia `RESEND_API_KEY`.
- **SMTP genérico**: rellena `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.

Las plantillas (`booking_received_client`, `booking_received_admin`, etc.) se guardan en
la tabla `EmailTemplate` y son editables desde `/admin/emails` (pendiente de UI — de
momento se insertan con el seed, ver `prisma/seed.ts`).

## 5. Arrancar en desarrollo

```bash
npm run dev
```

## 6. Cómo funciona el anti-doble-reserva (importante para entender el código)

1. `GET /api/booking/availability` calcula huecos combinando: horario de trabajo,
   bloqueos manuales, reservas internas (`PENDING`/`CONFIRMED`/`HOLD` no caducado) y
   **freebusy real de Google Calendar** (`src/lib/googleCalendar.ts`).
2. Al elegir un hueco, `POST /api/booking/hold` **vuelve a comprobar disponibilidad** y
   crea una fila `Booking` en estado `HOLD` con `holdExpiresAt` a 10 minutos. Esa fila ya
   "ocupa" el hueco para cualquier otra consulta de disponibilidad mientras no caduque.
3. Si la novia completa el formulario a tiempo, `POST /api/booking/confirm` pasa la
   reserva a `PENDING`, crea el evento real en Google Calendar y guarda su `googleEventId`.
   Si Google Calendar falla, la reserva queda igualmente creada pero marcada con
   `googleSyncError` para que el admin la sincronice manualmente — nunca se confirma en
   silencio sin evento real.
4. Un cron (`/api/cron/release-holds`, cada minuto vía `vercel.json`) libera los `HOLD`
   caducados que nadie completó.

Esto cubre las reglas #15, #41, #42 y #54 del briefing original.

## 7. Pendiente para producción (siguiente fase)

- [ ] Frontend editorial completo (hero, galería masonry, bodas reales, opiniones) —
      diseño acordado: paleta ivory/champagne/nude, serif editorial + sans, ver `tailwind.config.ts`
- [ ] Panel `/admin` completo (calendario visual, CRM de clientes, gestión de contenido)
- [ ] Autenticación admin real (sustituir `src/lib/auth.ts` por NextAuth)
- [ ] SEO técnico (metadata, schema.org, sitemap) por página
- [ ] Tests de disponibilidad/timezone/hold descritos en el briefing (sección 60)
- [ ] Textos legales (política de privacidad, cookies, aviso legal) — requieren datos
      reales de Jessica, no se inventan (NIF, dirección, etc.)
- [ ] Fotografías reales — el código está preparado para subirlas vía `GalleryImage`,
      de momento usar placeholders marcados con `isPlaceholder: true`

## 8. Seguridad — checklist ya aplicado

- Refresh token de Google cifrado con AES-256-GCM (`src/lib/crypto.ts`), nunca en claro.
- Ningún secreto (`GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, SMTP) se referencia desde el
  cliente — todo vive en API routes de servidor.
- `.env` está en `.gitignore`; solo se versiona `.env.example`.
