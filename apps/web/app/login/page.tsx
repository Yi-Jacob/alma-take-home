"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/components/Wordmark";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const data = new FormData(event.currentTarget);
    const payload = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body?.error ?? "Unable to sign in. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't reach our servers. Please try again in a moment.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-sage/70">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-5">
          <Wordmark />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow">Attorney portal</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-pine">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted">
            Review and manage incoming case assessments.
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-8 rounded-2xl border border-sage bg-white p-6 shadow-[0_18px_40px_-24px_rgba(18,53,40,0.35)]"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-sage-strong bg-paper px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-pine focus:bg-white"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-sage-strong bg-paper px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:border-pine focus:bg-white"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-brass/40 bg-brass-050 px-3.5 py-2.5 text-sm text-amber-900"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-pine px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-pine-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 rounded-xl border border-dashed border-sage-strong bg-paper-2 px-4 py-3 text-xs text-muted">
            <span className="font-medium text-ink">Demo credentials</span>
            <br />
            <span className="font-mono">attorney@example.com</span> /{" "}
            <span className="font-mono">password123</span>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-pine underline-offset-4 hover:underline"
          >
            ← Back to case assessment
          </Link>
        </div>
      </main>
    </div>
  );
}
