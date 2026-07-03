"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-20">
      <div className="w-full max-w-md rounded-2xl border border-sage bg-white p-8 text-center shadow-[0_18px_40px_-30px_rgba(18,53,40,0.4)]">
        <h2 className="font-display text-xl font-semibold text-pine">
          Couldn&apos;t load leads
        </h2>
        <p className="mt-2 text-sm text-muted">
          Something went wrong on our end. Give it another try.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-pine px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-pine-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
