import { google } from "googleapis";
import { prisma } from "./db";
import { encrypt, decrypt } from "./crypto";
import { localToUtc } from "./timezone";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/** Paso 1 del flujo admin: URL a la que redirigir a Jessica para autorizar. */
export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // imprescindible para obtener refresh_token
    prompt: "consent", // fuerza a que Google reemita refresh_token en reconexiones
    scope: SCOPES,
  });
}

/** Paso 2: callback de Google con ?code=... */
export async function handleOAuthCallback(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error(
      "Google no devolvió refresh_token. Revoca el acceso previo en " +
        "https://myaccount.google.com/permissions y vuelve a intentar (prompt=consent ya está forzado)."
    );
  }

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: profile } = await oauth2.userinfo.get();

  const encryptedRefreshToken = encrypt(tokens.refresh_token);

  // Por defecto usamos "primary"; el admin puede cambiarlo después desde /admin/settings
  await prisma.calendarConnection.upsert({
    where: { id: "singleton" }, // ver nota abajo
    create: {
      id: "singleton",
      googleAccountEmail: profile.email ?? "desconocido",
      encryptedRefreshToken,
      calendarId: "primary",
      connected: true,
    },
    update: {
      googleAccountEmail: profile.email ?? "desconocido",
      encryptedRefreshToken,
      connected: true,
    },
  });
}

async function getAuthorizedClient() {
  const conn = await prisma.calendarConnection.findUnique({ where: { id: "singleton" } });
  if (!conn || !conn.connected) {
    throw new Error("Google Calendar no está conectado. Conéctalo desde /admin/settings.");
  }
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: decrypt(conn.encryptedRefreshToken) });
  return { client, calendarId: conn.calendarId };
}

export async function isCalendarConnected(): Promise<boolean> {
  const conn = await prisma.calendarConnection.findUnique({ where: { id: "singleton" } });
  return Boolean(conn?.connected);
}

/**
 * Comprueba franjas ocupadas en el calendario real de Google entre dos
 * instantes UTC. Se usa SIEMPRE antes de mostrar/confirmar disponibilidad
 * — nunca confiar solo en la base de datos interna (regla #15 del brief).
 */
export async function getBusySlots(rangeStartUtc: Date, rangeEndUtc: Date) {
  const { client, calendarId } = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth: client });

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: rangeStartUtc.toISOString(),
      timeMax: rangeEndUtc.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  return res.data.calendars?.[calendarId]?.busy ?? [];
}

interface BookingEventInput {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  weddingDate?: string | null;
  weddingPlace?: string | null;
  guestCount?: number | null;
  comments?: string | null;
  status: string;
  totalPrice?: number | null;
  depositAmount?: number | null;
  balanceDue?: number | null;
  dateStr: string; // YYYY-MM-DD (fecha del servicio en sí, prueba o día B)
  startTime: string; // HH:mm local
  endTime: string; // HH:mm local
}

function buildEventBody(input: BookingEventInput) {
  const description = [
    "CLIENTA",
    `Nombre: ${input.clientName}`,
    `Email: ${input.clientEmail}`,
    `Teléfono: ${input.clientPhone}`,
    "",
    "SERVICIO:",
    input.serviceName,
    "",
    "FECHA BODA:",
    input.weddingDate ?? "—",
    "",
    "LUGAR:",
    input.weddingPlace ?? "—",
    "",
    "PERSONAS:",
    String(input.guestCount ?? 1),
    "",
    "OBSERVACIONES:",
    input.comments ?? "—",
    "",
    "RESERVA:",
    input.status,
    "",
    `Precio: ${input.totalPrice ?? "—"}`,
    `Paga y señal: ${input.depositAmount ?? "—"}`,
    `Resto: ${input.balanceDue ?? "—"}`,
    "",
    "Reserva creada desde: Jess Novias Makeup",
  ].join("\n");

  return {
    summary: `NOVIA — ${input.clientName} — Jess Novias Makeup`,
    description,
    location: input.weddingPlace ?? undefined,
    start: { dateTime: localToUtc(input.dateStr, input.startTime).toISOString(), timeZone: "Europe/Madrid" },
    end: { dateTime: localToUtc(input.dateStr, input.endTime).toISOString(), timeZone: "Europe/Madrid" },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 * 24 }, // 1 día antes
        { method: "popup", minutes: 60 * 2 }, // 2h antes
      ],
    },
  };
}

export async function createBookingEvent(input: BookingEventInput): Promise<string> {
  const { client, calendarId } = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth: client });
  const res = await calendar.events.insert({
    calendarId,
    requestBody: buildEventBody(input),
  });
  if (!res.data.id) throw new Error("Google Calendar no devolvió un ID de evento");
  return res.data.id;
}

export async function updateBookingEvent(googleEventId: string, input: BookingEventInput) {
  const { client, calendarId } = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth: client });
  await calendar.events.update({
    calendarId,
    eventId: googleEventId,
    requestBody: buildEventBody(input),
  });
}

export async function cancelBookingEvent(googleEventId: string) {
  const { client, calendarId } = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth: client });
  // No fallar si el evento ya no existe en Google (pudo borrarse manualmente)
  try {
    await calendar.events.delete({ calendarId, eventId: googleEventId });
  } catch (err: any) {
    if (err?.code !== 404 && err?.code !== 410) throw err;
  }
}
