// Server-side base URL. In Docker this resolves to http://api:8000.
// Falls back to the public URL when the internal one is not set.
export const API_INTERNAL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

// Browser-facing base URL for direct client requests (e.g. the public form).
export const API_PUBLIC =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const ACCESS_TOKEN_COOKIE = "access_token";
