import type { LeadState } from "@/lib/types";

const STATUS: Record<
  LeadState,
  { label: string; className: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-status-amber-bg text-status-amber-fg",
    dot: "bg-status-amber-fg",
  },
  REACHED_OUT: {
    label: "Reached out",
    className: "bg-status-green-bg text-status-green-fg",
    dot: "bg-status-green-fg",
  },
};

export function StatusBadge({ state }: { state: LeadState }) {
  const { label, className, dot } = STATUS[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
