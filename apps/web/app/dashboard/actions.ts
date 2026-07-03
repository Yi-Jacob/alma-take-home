"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { API_INTERNAL, ACCESS_TOKEN_COOKIE } from "@/lib/api";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function markReachedOut(id: string | number): Promise<ActionResult> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return { ok: false, error: "Your session expired. Sign in again." };
  }

  const response = await fetch(`${API_INTERNAL}/api/v1/leads/${id}/state`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ state: "REACHED_OUT" }),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 409) {
      return { ok: false, error: "This lead was already marked reached out." };
    }
    if (response.status === 401) {
      return { ok: false, error: "Your session expired. Sign in again." };
    }
    return { ok: false, error: "Couldn't update this lead. Try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
