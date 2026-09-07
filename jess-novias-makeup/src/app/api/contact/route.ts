import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, weddingDate, location, service, message, honeypot } = body;

  // Antispam básico: campo oculto que un bot rellenaría y un humano no ve
  if (honeypot) {
    return NextResponse.json({ ok: true }); // respondemos ok sin procesar, no delatamos el filtro
  }

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  await prisma.lead.create({
    data: {
      source: "contact-form",
      message: [
        `Nombre: ${name}`,
        `Email: ${email}`,
        `Teléfono: ${phone ?? "—"}`,
        `Fecha boda: ${weddingDate ?? "—"}`,
        `Localidad: ${location ?? "—"}`,
        `Servicio: ${service ?? "—"}`,
        "",
        message,
      ].join("\n"),
    },
  });

  // TODO: enviar notificación por email a Jessica (ver src/lib/email.ts)

  return NextResponse.json({ ok: true });
}
