import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Configurar en vercel.json como cron cada minuto, o como job externo
 * si se despliega en servidor propio. Protegido con CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await prisma.booking.updateMany({
    where: { status: "HOLD", holdExpiresAt: { lt: new Date() } },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ released: result.count });
}
