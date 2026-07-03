import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { LeadForm } from "./LeadForm";

const CATEGORIES = [
  "O-1",
  "EB-1A",
  "EB-2 NIW",
  "H-1B",
  "L-1",
  "Family / I-130",
  "Asylum",
];

const STEPS = [
  {
    title: "Share your background",
    body: "A few details and your resume. Two minutes, no account needed.",
  },
  {
    title: "An attorney reviews",
    body: "We assess which visa paths realistically fit your profile.",
  },
  {
    title: "We reach out",
    body: "You get a candid read on your options and what comes next.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-sage/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Wordmark />
          <Link
            href="/login"
            className="text-sm font-medium text-pine underline-offset-4 hover:underline"
          >
            Attorney login
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className="eyebrow">Confidential case assessment</p>
            <h1 className="mt-4 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.02em] text-pine sm:text-[3.25rem]">
              Get an assessment of your immigration case.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Meridian&apos;s attorneys read your background and tell you, plainly,
              which paths to a U.S. visa are worth pursuing — before you spend a
              dollar on filing.
            </p>

            <div className="mt-8">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                Visa paths we assess
              </p>
              <ul className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <li
                    key={c}
                    className="rounded-full border border-sage-strong bg-paper-2 px-3 py-1 font-mono text-xs text-pine"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <ol className="mt-10 space-y-5 border-l border-sage pl-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-sage-strong bg-paper font-mono text-xs text-brass"
                  >
                    {i + 1}
                  </span>
                  <p className="font-medium text-ink">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:pt-2">
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-sage/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-6 text-xs text-muted sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Meridian Immigration Law</span>
          <span>Not legal advice until an engagement is signed.</span>
        </div>
      </footer>
    </div>
  );
}
