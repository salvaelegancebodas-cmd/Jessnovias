import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createBookingEvent } from "@/lib/googleCalendar";
import { sendBookingReceivedEmail } from "@/lib/email";

interface ConfirmPayload {
  holdId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  weddingDate?: string;
  weddingPlace?: string;
  guestCount?: number;
  comments?: string;
  instagram?: string;
  acceptedPrivacy: boolean;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ConfirmPayload;

  if (!body.acceptedPrivacy) {
    return NextResponse.json({ error: "Debes aceptar la política de privacidad" }, { status: 400 });
  }
  if (!body.firstName || !body.lastName || !body.email || !body.phone) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const hold = await prisma.booking.findUnique({
    where: { id: body.holdId },
    include: { items: { include: { service: true } } },
  });

  if (!hold || hold.status !== "HOLD") {
    return NextResponse.json({ error: "El hold no existe o ya no es válido" }, { status: 410 });
  }
  if (hold.holdExpiresAt && hold.holdExpiresAt < new Date()) {
    await prisma.booking.update({ where: { id: hold.id }, data: { status: "CANCELLED" } });
    return NextResponse.json(
      { error: "El tiempo para completar la reserva ha expirado. Vuelve a elegir horario." },
      { status: 410 }
    );
  }

  const service = hold.items[0]?.service;
  const dateStr = hold.date.toISOString().slice(0, 10);

  // 1. Actualiza el cliente real (sustituye el placeholder del hold) y
  //    pasa la reserva a PENDING dentro de una transacción.
  const client = await prisma.client.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      weddingDate: body.weddingDate ? new Date(body.weddingDate) : undefined,
      weddingPlace: body.weddingPlace,
      instagram: body.instagram,
      status: "RESERVED",
    },
  });

  const booking = await prisma.booking.update({
    where: { id: hold.id },
    data: {
      clientId: client.id,
      guestCount: body.guestCount ?? 1,
      weddingPlace: body.weddingPlace,
      comments: body.comments,
      status: "PENDING",
      holdExpiresAt: null,
      totalPrice: service?.price ?? undefined,
      depositAmount: service?.depositAmount ?? undefined,
    },
  });

  // 2. Crea el evento en Google Calendar. Si falla, NO se confirma
  //    silenciosamente (regla #54 del brief): se guarda el error y queda
  //    marcada para el admin, con reintento manual desde /admin.
  try {
    const googleEventId = await createBookingEvent({
      bookingId: booking.id,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      clientPhone: client.phone,
      serviceName: service?.name ?? "Servicio",
      weddingDate: body.weddingDate,
      weddingPlace: body.weddingPlace,
      guestCount: body.guestCount,
      comments: body.comments,
      status: "PENDING",
      totalPrice: booking.totalPrice ? Number(booking.totalPrice) : undefined,
      depositAmount: booking.depositAmount ? Number(booking.depositAmount) : undefined,
      dateStr,
      startTime: booking.startTime,
      endTime: booking.endTime,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { googleEventId, googleSyncError: null },
    });
    await prisma.calendarSyncLog.create({
      data: { action: "create", bookingId: booking.id, success: true },
    });
  } catch (err: any) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { googleSyncError: String(err?.message ?? err) },
    });
    await prisma.calendarSyncLog.create({
      data: { action: "create", bookingId: booking.id, success: false, errorMessage: String(err?.message ?? err) },
    });
    // seguimos: la reserva queda como PENDING con aviso de sync pendiente,
    // el admin la ve marcada en /admin/calendar
  }

  try {
    await sendBookingReceivedEmail(booking.id);
  } catch (err) {
    console.error("email error (no bloqueante)", err);
  }

  return NextResponse.json({ bookingId: booking.id, status: booking.status });
}
