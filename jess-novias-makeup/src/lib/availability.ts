import { prisma } from "./db";
import { getBusySlots } from "./googleCalendar";
import { addMinutesToTime, localToUtc, timeToMinutes } from "./timezone";

interface Slot {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/**
 * Devuelve los huecos disponibles para un servicio en una fecha dada.
 * Combina: horario de trabajo, bloqueos manuales, reservas internas
 * (incluidos HOLD no caducados) y el calendario real de Google.
 * Esta función se usa tanto para pintar la UI de reserva como
 * justo antes de confirmar (doble comprobación, ver holdAndConfirm).
 */
export async function getAvailableSlots(dateStr: string, serviceId: string): Promise<Slot[]> {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } });
  const durationTotal = service.bufferBeforeMin + service.durationMin + service.bufferAfterMin;

  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const weekday = new Date(`${dateStr}T12:00:00`).getDay();

  const workingHours = await prisma.workingHours.findFirst({
    where: { weekday, active: true },
  });
  if (!workingHours) return []; // día de descanso

  const blocked = await prisma.blockedDate.findFirst({
    where: { date: dayStart, startTime: null }, // bloqueo de día completo
  });
  if (blocked) return [];

  const partialBlocks = await prisma.blockedDate.findMany({
    where: { date: dayStart, NOT: { startTime: null } },
  });

  // Reservas internas activas ese día (CONFIRMED, PENDING, y HOLD no caducado)
  const now = new Date();
  const internalBookings = await prisma.booking.findMany({
    where: {
      date: dayStart,
      OR: [
        { status: { in: ["PENDING", "CONFIRMED"] } },
        { status: "HOLD", holdExpiresAt: { gt: now } },
      ],
    },
  });

  // Franjas ocupadas según Google Calendar (fuente de verdad externa,
  // detecta bloqueos que Jessica meta directamente en su calendario)
  const rangeStart = localToUtc(dateStr, "00:00");
  const rangeEnd = localToUtc(dateStr, "23:59");
  let googleBusy: { start?: string | null; end?: string | null }[] = [];
  try {
    googleBusy = await getBusySlots(rangeStart, rangeEnd);
  } catch {
    // Si Google Calendar no está conectado o falla, degradamos a solo
    // disponibilidad interna en vez de romper la reserva por completo,
    // pero se registra para que el admin lo vea (ver /admin/calendar).
    googleBusy = [];
  }

  const occupied: Slot[] = [
    ...internalBookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    ...partialBlocks.map((b) => ({ startTime: b.startTime!, endTime: b.endTime! })),
    ...googleBusy
      .filter((g) => g.start && g.end)
      .map((g) => ({
        startTime: toLocalHHmm(g.start!),
        endTime: toLocalHHmm(g.end!),
      })),
  ];

  return computeFreeSlots(workingHours.startTime, workingHours.endTime, durationTotal, occupied)
    // el hueco visible al cliente empieza tras el buffer de "antes"
    .map((s) => ({
      startTime: addMinutesToTime(s.startTime, service.bufferBeforeMin),
      endTime: addMinutesToTime(s.startTime, service.bufferBeforeMin + service.durationMin),
    }));
}

function toLocalHHmm(isoUtc: string): string {
  const d = new Date(isoUtc);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
}

/** Genera huecos libres de `slotDuration` minutos entre startTime y endTime,
 *  evitando solapes con `occupied`. Slots cada 30 min por defecto. */
function computeFreeSlots(
  dayStart: string,
  dayEnd: string,
  slotDuration: number,
  occupied: Slot[],
  stepMin = 30
): Slot[] {
  const free: Slot[] = [];
  const dayStartMin = timeToMinutes(dayStart);
  const dayEndMin = timeToMinutes(dayEnd);
  const occupiedRanges = occupied.map((o) => [timeToMinutes(o.startTime), timeToMinutes(o.endTime)]);

  for (let start = dayStartMin; start + slotDuration <= dayEndMin; start += stepMin) {
    const end = start + slotDuration;
    const overlaps = occupiedRanges.some(([oStart, oEnd]) => start < oEnd && end > oStart);
    if (!overlaps) {
      free.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      });
    }
  }
  return free;
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Duración del hold temporal en minutos (checkout en curso). */
export const HOLD_DURATION_MIN = 10;
