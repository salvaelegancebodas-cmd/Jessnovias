import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableSlots, HOLD_DURATION_MIN } from "@/lib/availability";

/**
 * Crea una reserva en estado HOLD válida por 10 minutos mientras la novia
 * rellena sus datos en el checkout. Se vuelve a comprobar disponibilidad
 * aquí (no basta con lo que ya se pintó en pantalla) para minimizar la
 * ventana de condición de carrera entre dos usuarios reservando a la vez.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, startTime, endTime, serviceId } = body as {
    date: string;
    startTime: string;
    endTime: string;
    serviceId: string;
  };

  if (!date || !startTime || !endTime || !serviceId) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const freshSlots = await getAvailableSlots(date, serviceId);
  const stillFree = freshSlots.some((s) => s.startTime === startTime && s.endTime === endTime);
  if (!stillFree) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible. Elige otro, por favor." },
      { status: 409 }
    );
  }

  // Placeholder de cliente vacío: se completa en /api/booking/confirm.
  // Se crea ya para reservar el hueco atómicamente vía la restricción de
  // la consulta de disponibilidad (que excluye HOLDs no caducados).
  const hold = await prisma.booking.create({
    data: {
      client: {
        create: { firstName: "(hold)", lastName: "", email: `hold-${Date.now()}@tmp.local`, phone: "" },
      },
      date: new Date(`${date}T00:00:00.000Z`),
      startTime,
      endTime,
      status: "HOLD",
      holdExpiresAt: new Date(Date.now() + HOLD_DURATION_MIN * 60 * 1000),
      items: { create: [{ serviceId, quantity: 1 }] },
    },
  });

  return NextResponse.json({ holdId: hold.id, expiresInSeconds: HOLD_DURATION_MIN * 60 });
}
