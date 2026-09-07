import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/googleCalendar";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  return NextResponse.redirect(getAuthUrl());
}
