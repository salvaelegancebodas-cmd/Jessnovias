import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/admin/configuracion?google_error=${error}`, req.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL(`/admin/configuracion?google_error=no_code`, req.url));
  }

  try {
    await handleOAuthCallback(code);
    return NextResponse.redirect(new URL(`/admin/configuracion?google_connected=1`, req.url));
  } catch (err: any) {
    console.error("Google OAuth callback error", err);
    return NextResponse.redirect(
      new URL(`/admin/configuracion?google_error=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
