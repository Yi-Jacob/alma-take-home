import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_INTERNAL, ACCESS_TOKEN_COOKIE } from "@/lib/api";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${API_INTERNAL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "That email and password don't match our records." },
      { status: 401 },
    );
  }

  const data: { access_token: string } = await upstream.json();

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Mirrors the API's ACCESS_TOKEN_TTL_MINUTES default (480 minutes = 8 hours).
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}
