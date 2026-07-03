"use client";

import { useEffect, useState, useTransition } from "react";
import { markReachedOut } from "./actions";

export function ReachOutButton({ id }: { id: string | number }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  function handleClick() {
    setError(null);
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    startTransition(async () => {
      const result = await markReachedOut(id);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            confirming
              ? "border-brass bg-brass-050 text-amber-900 hover:bg-brass/20"
              : "border-pine bg-pine text-paper hover:bg-pine-600"
          }`}
        >
          {pending
            ? "Saving…"
            : confirming
              ? "Confirm reach-out"
              : "Mark reached out"}
        </button>
        {confirming && !pending && (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            aria-label="Cancel"
            className="rounded-lg border border-sage-strong px-2 py-1.5 text-xs text-muted transition-colors hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>
      {error && (
        <span role="alert" className="text-right text-xs text-status-amber-fg">
          {error}
        </span>
      )}
    </div>
  );
}
