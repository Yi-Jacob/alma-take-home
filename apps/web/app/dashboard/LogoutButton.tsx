"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="rounded-lg border border-sage-strong bg-white px-3 py-1.5 text-sm font-medium text-pine transition-colors hover:bg-paper-2 disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
