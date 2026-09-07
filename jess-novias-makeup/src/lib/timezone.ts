/**
 * Todas las fechas se guardan en UTC en la base de datos.
 * Toda la lógica de negocio (horarios de trabajo, disponibilidad,
 * eventos de calendario) se razona en Europe/Madrid, que maneja
 * automáticamente el cambio CET/CEST vía Intl / date-fns-tz.
 *
 * IMPORTANTE: nunca hacer aritmética de horas "a mano" (+1h, +2h)
 * para CET/CEST — usar siempre estas utilidades, que delegan en el
 * motor de zonas horarias de Node/ICU.
 */
import { zonedTimeToUtc, utcToZonedTime, format } from "date-fns-tz";

export const APP_TIMEZONE = "Europe/Madrid";

/** Combina una fecha (YYYY-MM-DD) y hora local (HH:mm) en Europe/Madrid
 *  y devuelve el instante UTC correspondiente, respetando CET/CEST. */
export function localToUtc(dateStr: string, timeStr: string): Date {
  const localIso = `${dateStr}T${timeStr}:00`;
  return zonedTimeToUtc(localIso, APP_TIMEZONE);
}

/** Convierte un instante UTC a fecha/hora local en Europe/Madrid. */
export function utcToLocal(date: Date): Date {
  return utcToZonedTime(date, APP_TIMEZONE);
}

export function formatLocal(date: Date, fmt = "yyyy-MM-dd HH:mm"): string {
  return format(utcToZonedTime(date, APP_TIMEZONE), fmt, { timeZone: APP_TIMEZONE });
}

/** Suma minutos a una hora "HH:mm" y devuelve otra "HH:mm" (sin cruzar de día). */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
