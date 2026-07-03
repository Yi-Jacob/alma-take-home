"use client";

import { useRef, useState } from "react";
import { API_PUBLIC } from "@/lib/api";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

const ACCEPT = ".pdf,.doc,.docx";
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const EMAIL_PATTERN = /.+@.+\..+/;

type FieldErrors = Partial<
  Record<"first_name" | "last_name" | "email", string>
>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

function friendlyResumeMessage(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("10") || lower.includes("size") || lower.includes("large")) {
    return "Resume must be 10 MB or smaller.";
  }
  if (lower.includes("type") || lower.includes("content") || lower.includes("allowed")) {
    return "Please upload a PDF, DOC, or DOCX file.";
  }
  if (lower.includes("empty")) {
    return "Attach your resume to continue.";
  }
  return "Please check your resume file and try again.";
}

function parseApiError(
  detail: unknown,
): { resume?: string; form?: string } {
  if (typeof detail === "string") {
    return { form: detail };
  }
  if (Array.isArray(detail) && detail.length > 0) {
    let resume: string | undefined;
    const other: string[] = [];

    for (const item of detail) {
      const { loc, msg } = item as { loc?: unknown[]; msg?: string };
      if (!msg) continue;
      const field = Array.isArray(loc) ? String(loc[loc.length - 1]) : null;
      if (field === "resume") {
        resume = friendlyResumeMessage(msg);
      } else if (field === "email") {
        other.push("Please enter a valid email address.");
      } else if (field === "first_name") {
        other.push("Please enter your first name.");
      } else if (field === "last_name") {
        other.push("Please enter your last name.");
      } else {
        other.push(msg);
      }
    }

    return {
      resume,
      form: other.length > 0 ? other.join(" ") : undefined,
    };
  }
  return {
    form: "Something went wrong. Please check your details and try again.",
  };
}

function validateResume(file: File | null): string | null {
  if (!file || file.size === 0) {
    return "Attach your resume to continue.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Resume must be 10 MB or smaller.";
  }
  return null;
}

export function LeadForm() {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearFieldError(name: keyof FieldErrors) {
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;
      return { ...previous, [name]: undefined };
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setResumeError(null);
      return;
    }
    setSelectedFile({ name: file.name, size: file.size });
    setResumeError(validateResume(file));
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
    const resumeValidation =
      resume instanceof File ? validateResume(resume) : "Attach your resume to continue.";
    if (resumeValidation) {
      setResumeError(resumeValidation);
      return;
    }
    setResumeError(null);

    setState({ status: "submitting" });

    try {
      const response = await fetch(`${API_PUBLIC}/api/v1/leads`, {
        method: "POST",
        body: data,
      });

      if (!response.ok) {
        let formMessage = "We couldn't submit your request. Please try again.";
        try {
          const body = await response.json();
          const parsed = parseApiError(body?.detail ?? body);
          if (parsed.resume) {
            setResumeError(parsed.resume);
          }
          if (parsed.form) {
            formMessage = parsed.form;
          } else if (parsed.resume && !parsed.form) {
            setState({ status: "idle" });
            return;
          }
        } catch {
          /* keep default message */
        }
        setState({ status: "error", message: formMessage });
        return;
      }

      setState({
        status: "success",
        email: String(data.get("email") ?? "").trim(),
      });
      setSelectedFile(null);
      setResumeError(null);
      form.reset();
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
          Thanks — we received your assessment request
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
  const resumeErrorId = "resume-error";

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
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Resume or CV
        </span>
        <label
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed bg-paper px-4 py-3.5 text-sm transition-colors hover:border-pine hover:bg-pine-050/50 ${
            resumeError ? "border-status-amber-fg" : "border-sage-strong"
          } ${selectedFile && !resumeError ? "border-pine bg-pine-050/30" : ""}`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                selectedFile && !resumeError
                  ? "bg-status-green-bg text-status-green-fg"
                  : "bg-brass-050 text-brass"
              }`}
            >
              {selectedFile && !resumeError ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 3v5h5M14 3l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="min-w-0 truncate text-ink">
              {selectedFile ? (
                <>
                  <span className="block truncate font-medium">{selectedFile.name}</span>
                  <span className="block text-xs text-muted">
                    {formatFileSize(selectedFile.size)} · Ready to submit
                  </span>
                </>
              ) : (
                <>
                  Choose a file
                  <span className="ml-1 block text-xs text-muted sm:inline">
                    PDF, DOC or DOCX. Max 10 MB.
                  </span>
                </>
              )}
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
            aria-invalid={resumeError ? true : undefined}
            aria-describedby={resumeError ? resumeErrorId : undefined}
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
        {resumeError && (
          <p id={resumeErrorId} className="mt-1.5 text-xs text-status-amber-fg">
            {resumeError}
          </p>
        )}
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
