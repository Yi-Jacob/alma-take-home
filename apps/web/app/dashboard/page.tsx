import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { StatusBadge } from "@/components/StatusBadge";
import { API_INTERNAL, ACCESS_TOKEN_COOKIE } from "@/lib/api";
import type { LeadRead } from "@/lib/types";
import { ReachOutButton } from "./ReachOutButton";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Case assessments · Meridian" };

const STATE_ORDER: Record<LeadRead["state"], number> = {
  PENDING: 0,
  REACHED_OUT: 1,
};

function sortLeads(leads: LeadRead[]): LeadRead[] {
  return leads.toSorted(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

async function getLeads(token: string): Promise<LeadRead[]> {
  const response = await fetch(`${API_INTERNAL}/api/v1/leads`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error(`Failed to load leads (${response.status})`);
  }

  return response.json();
}

export default async function DashboardPage() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }

  const leads = sortLeads(await getLeads(token));
  const pendingCount = leads.filter((l) => l.state === "PENDING").length;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-sage/70 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Wordmark href="/dashboard" />
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="eyebrow">Attorney portal</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-pine">
              Case assessments
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Review pending requests, contact each prospect, then mark them once
              you&apos;ve reached out.
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Stat label="Total" value={leads.length} />
            <span aria-hidden className="h-8 w-px bg-sage" />
            <Stat label="Pending" value={pendingCount} accent />
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-sage bg-white shadow-[0_18px_40px_-30px_rgba(18,53,40,0.4)]">
          {leads.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <h2 className="font-display text-xl font-semibold text-pine">
                No assessments yet
              </h2>
              <p className="mt-2 text-sm text-muted">
                New case assessments will appear here as they come in.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-sage bg-paper-2 text-left">
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Resume</Th>
                    <Th>Status</Th>
                    <Th>Confirmation</Th>
                    <Th>Submitted</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-sage/60 last:border-0 hover:bg-paper/60 ${
                        lead.state === "PENDING"
                          ? "border-l-2 border-l-brass bg-status-amber-bg/25"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-4 font-medium text-ink">
                        {lead.first_name} {lead.last_name}
                      </td>
                      <td className="px-5 py-4 text-muted">
                        <a
                          href={`mailto:${lead.email}`}
                          className="underline-offset-2 hover:text-pine hover:underline"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        {lead.resume_url ? (
                          <a
                            href={lead.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-pine underline-offset-2 hover:underline"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {lead.resume_filename ?? "Download"}
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge state={lead.state} />
                      </td>
                      <td className="px-5 py-4">
                        <ConfirmationStatus sentAt={lead.notification_sent_at} />
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-muted">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {lead.state === "PENDING" ? (
                          <ReachOutButton id={lead.id} />
                        ) : (
                          <span className="block font-mono text-xs text-muted">
                            {lead.reached_out_at
                              ? `Reached out ${formatDate(lead.reached_out_at)}`
                              : "Reached out"}
                            {lead.reached_out_by && (
                              <span className="block">
                                by {lead.reached_out_by}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ConfirmationStatus({ sentAt }: { sentAt: string | null }) {
  if (sentAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-status-green-fg">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-status-green-fg" />
        Sent
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-status-amber-fg">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-status-amber-fg" />
      Not confirmed
    </span>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="text-right">
      <div
        className={`font-display text-2xl font-semibold leading-none ${
          accent ? "text-brass" : "text-pine"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted ${className}`}
    >
      {children}
    </th>
  );
}
