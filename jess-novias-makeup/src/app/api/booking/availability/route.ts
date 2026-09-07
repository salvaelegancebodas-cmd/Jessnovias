import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!date || !serviceId) {
    return NextResponse.json({ error: "Faltan parámetros date o serviceId" }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(date, serviceId);
    return NextResponse.json({ date, serviceId, slots });
  } catch (err) {
    console.error("availability error", err);
    return NextResponse.json({ error: "No se pudo calcular la disponibilidad" }, { status: 500 });
  }
}
