"use client";

import { useState, useTransition } from "react";
import { markReachedOut } from "./actions";

export function ReachOutButton({ id }: { id: string | number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await markReachedOut(id);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-pine bg-pine px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:bg-pine-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Mark reached out"}
      </button>
      {error && (
        <span role="alert" className="text-right text-xs text-status-amber-fg">
          {error}
        </span>
      )}
    </div>
  );
}
