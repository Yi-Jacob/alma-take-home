import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-baseline gap-2">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 translate-y-[-1px] rounded-full bg-brass ring-2 ring-brass-050"
      />
      <span className="font-display text-lg font-semibold tracking-tight text-pine">
        Meridian
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Immigration Law
      </span>
    </Link>
  );
}
