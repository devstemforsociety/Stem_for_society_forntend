/**
 * Environment access.
 *
 * Nothing in this module throws. Reading configuration used to blow up at
 * import time, which meant a single missing variable turned the whole site
 * into a blank page. Instead we report what is missing and let the caller
 * decide: developers get a loud config screen, production visitors keep a
 * working site and only lose the features that genuinely need the variable.
 */

const RAW = import.meta.env as unknown as Record<string, string | undefined>;

export type EnvIssue = { key: string; impact: string };

/**
 * Variables the app needs. `impact` is written for whoever has to fix it, and
 * is only ever shown to admins/developers.
 */
const REQUIRED: EnvIssue[] = [
  {
    key: "VITE_SUPABASE_URL",
    impact:
      "Supabase project URL. Without it, Supabase sign-in and account features cannot work.",
  },
  {
    key: "VITE_SUPABASE_ANON_KEY",
    impact:
      "Supabase anon/public key. Without it, Supabase sign-in and account features cannot work.",
  },
];

const OPTIONAL: EnvIssue[] = [
  {
    key: "VITE_BACKEND_URL",
    impact:
      "Base URL of the API. Falls back to http://localhost:3001, which will not resolve for deployed visitors.",
  },
  {
    key: "VITE_RZPY_KEYID",
    impact: "Razorpay key id. Without it, checkout cannot be opened.",
  },
];

function value(key: string): string {
  const raw = RAW[key];
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  /**
   * Strip one layer of wrapping quotes.
   *
   * A .env file has its quotes removed by the loader, so VALUE and "VALUE"
   * behave identically there. A hosting dashboard (Vercel, Netlify) does not:
   * whatever is pasted becomes the literal value, quotes included, and Vite
   * bakes those quotes into the bundle. Production shipped a quoted anon key
   * rather than a bare one, which Supabase rejects as an invalid API key -
   * breaking Google sign-in in prod while every .env-based environment kept
   * working.
   */
  const unquoted =
    trimmed.length >= 2 &&
    ((trimmed.startsWith(`"`) && trimmed.endsWith(`"`)) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  return unquoted;
}

export type AppEnv = {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_BACKEND_URL: string;
  VITE_RZPY_KEYID: string;
  VITE_SENTRY_DSN: string;
};

/** Never throws. Missing values come back as empty strings. */
export function getEnv(): AppEnv {
  return {
    VITE_SUPABASE_URL: value("VITE_SUPABASE_URL"),
    VITE_SUPABASE_ANON_KEY: value("VITE_SUPABASE_ANON_KEY"),
    VITE_BACKEND_URL: value("VITE_BACKEND_URL"),
    VITE_RZPY_KEYID: value("VITE_RZPY_KEYID"),
    VITE_SENTRY_DSN: value("VITE_SENTRY_DSN"),
  };
}

/** Required variables that are missing. Empty array means all good. */
export function getMissingRequired(): EnvIssue[] {
  return REQUIRED.filter((entry) => value(entry.key) === "");
}

/** Optional variables that are missing, for the diagnostics panel. */
export function getMissingOptional(): EnvIssue[] {
  return OPTIONAL.filter((entry) => value(entry.key) === "");
}

export function isSupabaseConfigured(): boolean {
  return (
    value("VITE_SUPABASE_URL") !== "" && value("VITE_SUPABASE_ANON_KEY") !== ""
  );
}

/**
 * Back-compat helper. Returns a description of what is misconfigured, or null
 * when the environment is complete. Deliberately does not throw.
 */
export function validateEnv(): string | null {
  const missing = getMissingRequired();
  if (missing.length === 0) return null;
  return missing.map((m) => `${m.key}: ${m.impact}`).join(" | ");
}
