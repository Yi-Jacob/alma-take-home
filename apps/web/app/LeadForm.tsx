"use client";

import { useRef, useState } from "react";
import { API_PUBLIC } from "@/lib/api";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

const ACCEPT = ".pdf,.doc,.docx";

const EMAIL_PATTERN = /.+@.+\..+/;

type FieldErrors = Partial<
  Record<"first_name" | "last_name" | "email", string>
>;

function validateFields(data: FormData): FieldErrors {
  const errors: FieldErrors = {};

  if (String(data.get("first_name") ?? "").trim() === "") {
    errors.first_name = "Please enter your first name.";
  }
  if (String(data.get("last_name") ?? "").trim() === "") {
    errors.last_name = "Please enter your last name.";
  }

  const email = String(data.get("email") ?? "").trim();
  if (email === "") {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
}

function extractError(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((item) => {
        const { loc, msg } = item as { loc?: unknown[]; msg?: string };
        if (!msg) return null;
        const field = Array.isArray(loc) ? loc[loc.length - 1] : null;
        return field ? `${field}: ${msg}` : msg;
      })
      .filter((message): message is string => message !== null);
    if (messages.length > 0) return messages.join("; ");
  }
  return "Something went wrong. Please check your details and try again.";
}

export function LeadForm() {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearFieldError(name: keyof FieldErrors) {
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;
      return { ...previous, [name]: undefined };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const errors = validateFields(data);
    if (Object.values(errors).some((message) => message !== undefined)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const resume = data.get("resume");
    if (!(resume instanceof File) || resume.size === 0) {
      setState({ status: "error", message: "Attach your resume to continue." });
      return;
    }
    if (resume.size > 10 * 1024 * 1024) {
      setState({
        status: "error",
        message: "Resume must be 10 MB or smaller.",
      });
      return;
    }

    setState({ status: "submitting" });

    try {
      const response = await fetch(`${API_PUBLIC}/api/v1/leads`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        let message = "We couldn't submit your request. Please try again.";
        try {
          const body = await response.json();
          message = extractError(body?.detail ?? body);
        } catch {
          /* keep default message */
        }
        setState({ status: "error", message });
        return;
      }

      setState({
        status: "success",
        email: String(data.get("email") ?? "").trim(),
      });
      setFileName(null);
    } catch {
      setState({
        status: "error",
        message: "We couldn't reach our servers. Please try again in a moment.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-sage bg-white p-8 shadow-[0_1px_0_rgba(18,53,40,0.04),0_18px_40px_-24px_rgba(18,53,40,0.35)]">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-status-green-bg">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M20 6 9 17l-5-5"
              stroke="#216040"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-pine">
          Thanks — we received your application
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          We&apos;ll write to you at{" "}
          <span className="font-medium text-ink">{state.email}</span>.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          One of our attorneys will review your background and reach out —
          typically within 2 business days. Assessments are confidential and
          carry no obligation.
        </p>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="mt-5 text-sm font-medium text-pine underline underline-offset-2 hover:text-pine-600"
        >
          Submit another request
        </button>
      </div>
    );
  }

  const submitting = state.status === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-sage bg-white p-6 shadow-[0_1px_0_rgba(18,53,40,0.04),0_18px_40px_-24px_rgba(18,53,40,0.35)] sm:p-8"
    >
      <div className="mb-6">
        <p className="eyebrow">Case assessment</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-pine">
          Request your review
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          name="first_name"
          autoComplete="given-name"
          required
          error={fieldErrors.first_name}
          onEdit={() => clearFieldError("first_name")}
        />
        <Field
          label="Last name"
          name="last_name"
          autoComplete="family-name"
          required
          error={fieldErrors.last_name}
          onEdit={() => clearFieldError("last_name")}
        />
      </div>

      <div className="mt-4">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fieldErrors.email}
          onEdit={() => clearFieldError("email")}
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Resume or CV
        </label>
        <label
          className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-sage-strong bg-paper px-4 py-3.5 text-sm transition-colors hover:border-pine hover:bg-pine-050/50"
          data-has-file={fileName ? "true" : "false"}
        >
          <span className="flex items-center gap-3 truncate">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brass-050 text-brass"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 3v5h5M14 3l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="truncate text-ink">
              {fileName ?? "Choose a file"}
              <span className="ml-1 block text-xs text-muted sm:inline">
                PDF, DOC or DOCX. Max 10 MB.
              </span>
            </span>
          </span>
          <span className="shrink-0 rounded-lg border border-sage-strong bg-white px-3 py-1.5 text-xs font-medium text-pine">
            Browse
          </span>
          <input
            ref={fileInputRef}
            type="file"
            name="resume"
            accept={ACCEPT}
            required
            className="sr-only"
            onChange={(e) =>
              setFileName(e.currentTarget.files?.[0]?.name ?? null)
            }
          />
        </label>
      </div>

      {state.status === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-brass/40 bg-brass-050 px-3.5 py-2.5 text-sm text-amber-900"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-pine px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-pine-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Request your assessment"}
      </button>

      <p className="mt-3 text-center text-xs text-muted">
        Confidential. No fee for the initial review.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  error,
  onEdit,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
  onEdit?: () => void;
}) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={onEdit}
        className="w-full rounded-xl border border-sage-strong bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted focus:border-pine focus:bg-white"
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-status-amber-fg">
          {error}
        </p>
      )}
    </div>
  );
}
