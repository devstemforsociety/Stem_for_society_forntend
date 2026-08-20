/**
 * Central error taxonomy.
 *
 * Every failure in the app is funnelled through `normalizeError` so that:
 *   - clients get a short, actionable message written from their perspective
 *   - admins get a concrete resolution hint (or "contact your developer")
 *   - observability gets the full technical detail plus a correlation id
 *
 * Hard rule: `userMessage` must never contain stack traces, file paths, driver
 * names, hostnames, SQL or any other system internal.
 */
import axios from "axios";

export type ErrorKind =
  | "offline"
  | "network"
  | "timeout"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "validation"
  | "conflict"
  | "rateLimited"
  | "server"
  | "maintenance"
  | "chunkLoad"
  | "config"
  | "unknown";

export type FieldError = { path: string; message: string };

export interface AppError {
  readonly __appError: true;
  kind: ErrorKind;
  /** Stable code for dashboards and alert rules. */
  code: string;
  status?: number;
  /** Safe to render to any visitor. */
  userMessage: string;
  /** What an operator should actually do. Shown to admins only. */
  adminHint: string;
  /** Short per-occurrence id, echoed in the UI and attached to Sentry events. */
  correlationId: string;
  retryable: boolean;
  fieldErrors?: FieldError[];
  /**
   * True when `userMessage` is our own generic copy rather than a message that
   * came from the failure itself. Call sites use this to decide whether their
   * own fallback wording would be more specific.
   */
  isGeneric: boolean;
  /** Raw detail: Sentry and the admin view only. Never shown to clients. */
  technical: string;
  cause: unknown;
}

export function isAppError(value: unknown): value is AppError {
  return typeof value === "object" && value !== null && "__appError" in value;
}

/** Short, human-quotable id so a user can read it out to support. */
export function newCorrelationId(): string {
  try {
    const c = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID().replace(/-/g, "").slice(0, 8);
    if (c?.getRandomValues) {
      const bytes = new Uint8Array(4);
      c.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* fall through to the non-crypto path */
  }
  return Math.random().toString(16).slice(2, 10);
}

/**
 * Markers that mean a string is leaking internals. A server message matching
 * any of these is dropped in favour of our own generic copy.
 */
const INTERNAL_MARKERS =
  /(\n|\bat\s+[\w$.]+\s*\(|:\d+:\d+\)|[A-Za-z]:\\|\/(?:usr|home|var|opt|root|etc|node_modules)\/|\b(?:ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN|EPIPE)\b|\b(?:prisma|sequelize|mongoose|mongodb|postgres(?:ql)?|mysql|sqlstate|redis|supabase)\b|stack trace|<html|<!doctype|cannot read propert|is not a function|is not defined|undefined is not|null is not)/i;

function isClientSafe(message: string): boolean {
  const text = message.trim();
  return text.length > 0 && text.length <= 160 && !INTERNAL_MARKERS.test(text);
}

/**
 * Native error types that only ever mean "there is a bug in our code". Their
 * messages are never shown to a visitor, however innocuous they look.
 */
const RUNTIME_BUG_NAMES = new Set([
  "TypeError",
  "ReferenceError",
  "SyntaxError",
  "RangeError",
  "EvalError",
  "URIError",
  "InternalError",
]);

/**
 * Sanitize a value that a call site wants to interpolate into its own copy
 * (a payment gateway's failure reason, for example). Returns the text when it
 * is safe to show, and the fallback when it is not.
 */
export function clientSafeText(
  text: unknown,
  fallback = "Please try again, or contact support if it continues.",
): string {
  return typeof text === "string" && isClientSafe(text) ? text.trim() : fallback;
}

const CHUNK_LOAD_MARKERS =
  /(loading chunk \S+ failed|loading css chunk|dynamically imported module|importing a module script failed|module script failed)/i;

type Copy = {
  code: string;
  userMessage: string;
  adminHint: string;
  retryable: boolean;
};

/**
 * Client copy is written from the visitor's perspective: what happened to
 * them, and what they can do next. Admin copy is the resolution path.
 */
const COPY: Record<ErrorKind, Copy> = {
  offline: {
    code: "CLIENT_OFFLINE",
    userMessage:
      "You appear to be offline. Check your internet connection and try again.",
    adminHint:
      "The browser reported no network connection. Nothing to fix on the server - the request never left the device.",
    retryable: true,
  },
  network: {
    code: "API_UNREACHABLE",
    userMessage:
      "We cannot reach our servers right now. This is on our side - please try again in a moment.",
    adminHint:
      "The API did not respond at all (connection refused, DNS failure, or blocked by CORS). Check that the backend service is running and healthy, that VITE_BACKEND_URL points at it, and that this domain is in the API allowed-origins list.",
    retryable: true,
  },
  timeout: {
    code: "API_TIMEOUT",
    userMessage:
      "The server is taking longer than usual to respond. Please try again.",
    adminHint:
      "The request exceeded the client timeout. Look for slow database queries, a cold start on the host, or an overloaded API instance.",
    retryable: true,
  },
  unauthorized: {
    code: "AUTH_REQUIRED",
    userMessage: "Your session has expired. Please sign in again to continue.",
    adminHint:
      "The API returned 401 - the token is missing, expired, or invalid. Confirm the JWT secret and expiry match between environments and that the Authorization header survives your proxy.",
    retryable: false,
  },
  forbidden: {
    code: "AUTH_FORBIDDEN",
    userMessage:
      "You do not have permission to do this. If you think that is wrong, contact your administrator.",
    adminHint:
      "The API returned 403 - the account is authenticated but its role fails the permission check on this route. Verify the role assignment for this user.",
    retryable: false,
  },
  notFound: {
    code: "NOT_FOUND",
    userMessage:
      "We could not find what you are looking for. It may have been moved or removed.",
    adminHint:
      "The API returned 404. Confirm the route exists on the deployed backend (not just locally) and that the record id in the URL is still valid.",
    retryable: false,
  },
  validation: {
    code: "VALIDATION_FAILED",
    userMessage: "Please check the highlighted fields and try again.",
    adminHint:
      "The API rejected the payload during validation. The exact field paths are listed with this error - align the form schema with the API schema.",
    retryable: false,
  },
  conflict: {
    code: "CONFLICT",
    userMessage:
      "This conflicts with something that already exists - it may have already been saved.",
    adminHint:
      "The API returned 409, usually a unique-constraint violation or a stale write. Reload the record and retry.",
    retryable: false,
  },
  rateLimited: {
    code: "RATE_LIMITED",
    userMessage:
      "Too many attempts in a short time. Please wait a moment and try again.",
    adminHint:
      "The API returned 429. Either the rate limit is too tight for normal use, or a client is retrying in a loop.",
    retryable: true,
  },
  server: {
    code: "SERVER_ERROR",
    userMessage:
      "Something went wrong on our side. Our team has been notified - please try again shortly.",
    adminHint:
      "The API returned 5xx. Search the backend logs and Sentry for the reference id below to get the original stack trace.",
    retryable: true,
  },
  maintenance: {
    code: "SERVICE_UNAVAILABLE",
    userMessage:
      "This service is temporarily unavailable. Please try again in a few minutes.",
    adminHint:
      "The API returned 503. The service is down, restarting, or still booting. Check the deployment status and health checks.",
    retryable: true,
  },
  chunkLoad: {
    code: "STALE_BUILD",
    userMessage:
      "A newer version of this site is available. Reload the page to continue.",
    adminHint:
      "A lazy-loaded chunk failed to download, which happens when an open tab requests files from a build that has been replaced. Harmless if rare; if constant, keep previous build assets reachable and make sure the CDN is not serving a stale index.html.",
    retryable: true,
  },
  config: {
    code: "APP_MISCONFIGURED",
    userMessage:
      "The site is not configured correctly and cannot start. Please contact support.",
    adminHint:
      "Required environment variables are missing or invalid. Set them in the hosting environment and redeploy. Remember that Vite only exposes variables prefixed with VITE_, and that they are baked in at build time.",
    retryable: false,
  },
  unknown: {
    code: "UNKNOWN",
    userMessage:
      "Something went wrong. Please try again - if it keeps happening, contact support.",
    adminHint:
      "This error could not be classified automatically. Please contact your developer with the reference id below so they can resolve it.",
    retryable: true,
  },
};

function kindForStatus(status: number): ErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 408) return "timeout";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
  if (status === 429) return "rateLimited";
  if (status === 503) return "maintenance";
  if (status >= 500) return "server";
  return "unknown";
}

function toFieldErrors(raw: unknown): FieldError[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const parsed = raw
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const record = entry as Record<string, unknown>;
      const path = Array.isArray(record.path)
        ? record.path.join(".")
        : typeof record.path === "string"
          ? record.path
          : "";
      const message =
        typeof record.message === "string" ? record.message : "Invalid value";
      return { path, message };
    })
    .filter((entry): entry is FieldError => entry !== null);
  return parsed.length > 0 ? parsed : undefined;
}

function extractServerPayload(data: unknown): {
  message?: string;
  fieldErrors?: FieldError[];
} {
  if (typeof data === "string") return { message: data };
  if (typeof data !== "object" || data === null) return {};

  const record = data as Record<string, unknown>;
  const fieldErrors = toFieldErrors(record.errors);
  const message =
    typeof record.error === "string"
      ? record.error
      : typeof record.message === "string"
        ? record.message
        : undefined;

  return { message, fieldErrors };
}

/** Strip query strings so tokens in URLs never reach logs or the admin view. */
function safeUrl(url?: string): string {
  if (!url) return "";
  return url.split("?")[0];
}

/**
 * Turn anything thrown anywhere in the app into a single predictable shape.
 * Safe to call with an already-normalized AppError (returns it unchanged).
 */
export function normalizeError(cause: unknown): AppError {
  if (isAppError(cause)) return cause;

  const correlationId = newCorrelationId();

  const build = (
    kind: ErrorKind,
    overrides: Partial<AppError> = {},
  ): AppError => ({
    __appError: true,
    kind,
    code: COPY[kind].code,
    userMessage: COPY[kind].userMessage,
    adminHint: COPY[kind].adminHint,
    retryable: COPY[kind].retryable,
    correlationId,
    isGeneric: true,
    technical: "",
    cause,
    ...overrides,
  });

  // Stale-deploy chunk failures look like ordinary errors but need their own
  // recovery path (reload), so they are checked before anything else.
  const rawMessage =
    cause instanceof Error
      ? cause.message
      : typeof cause === "string"
        ? cause
        : "";
  if (rawMessage && CHUNK_LOAD_MARKERS.test(rawMessage)) {
    return build("chunkLoad", { technical: rawMessage });
  }

  if (axios.isAxiosError(cause)) {
    const method = (cause.config?.method ?? "get").toUpperCase();
    const url = safeUrl(cause.config?.url);

    // No response at all: the request never completed.
    if (!cause.response) {
      const offline =
        typeof navigator !== "undefined" && navigator.onLine === false;
      const timedOut =
        cause.code === "ECONNABORTED" || cause.code === "ETIMEDOUT";
      const kind: ErrorKind = offline
        ? "offline"
        : timedOut
          ? "timeout"
          : "network";
      return build(kind, {
        technical: `${method} ${url} failed before a response (${cause.code ?? "no code"}): ${cause.message}`,
      });
    }

    const status = cause.response.status;
    const kind = kindForStatus(status);
    const { message: serverMessage, fieldErrors } = extractServerPayload(
      cause.response.data,
    );

    // Server-authored copy is shown only for 4xx (deliberate, user-facing
    // messages) and only when it carries no internals. 5xx bodies are never
    // surfaced - that is where stack traces and driver errors leak from.
    const useServerMessage =
      !!serverMessage && status < 500 && isClientSafe(serverMessage);

    return build(kind, {
      status,
      fieldErrors,
      isGeneric: !useServerMessage,
      userMessage: useServerMessage
        ? serverMessage.trim()
        : COPY[kind].userMessage,
      technical:
        `${method} ${url} -> ${status}` +
        (serverMessage ? ` | server said: ${serverMessage}` : "") +
        (fieldErrors
          ? ` | fields: ${fieldErrors.map((f) => f.path).join(", ")}`
          : ""),
    });
  }

  if (cause instanceof Error) {
    // Errors raised deliberately by a library (Supabase auth, for instance)
    // carry copy worth showing. Native runtime errors never do - they mean we
    // have a bug, and their wording only confuses a visitor.
    const trustMessage =
      !RUNTIME_BUG_NAMES.has(cause.name) && isClientSafe(cause.message);

    return build("unknown", {
      isGeneric: !trustMessage,
      userMessage: trustMessage
        ? cause.message.trim()
        : COPY.unknown.userMessage,
      technical: `${cause.name}: ${cause.message}`,
    });
  }

  // A thrown string is almost always a deliberate message, so it is shown when
  // it passes the safety filter.
  if (typeof cause === "string") {
    const safe = isClientSafe(cause);
    return build("unknown", {
      isGeneric: !safe,
      userMessage: safe ? cause.trim() : COPY.unknown.userMessage,
      technical: cause,
    });
  }

  return build("unknown", { technical: `Non-error thrown: ${String(cause)}` });
}

/**
 * Wrap a message string that a call site already treats as user-facing.
 *
 * The string still goes through the safety filter, so a raw server or driver
 * message passed in by older code is replaced with generic copy rather than
 * being shown to a visitor.
 */
export function messageError(message: string): AppError {
  const safe = isClientSafe(message);
  return {
    __appError: true,
    kind: "unknown",
    code: COPY.unknown.code,
    userMessage: safe ? message.trim() : COPY.unknown.userMessage,
    adminHint: COPY.unknown.adminHint,
    retryable: true,
    correlationId: newCorrelationId(),
    isGeneric: !safe,
    technical: message,
    cause: new Error(message),
  };
}

/**
 * Build a config error explicitly. Used by the env guard, which fails before
 * any request is ever made.
 */
export function configError(detail: string): AppError {
  return {
    __appError: true,
    kind: "config",
    code: COPY.config.code,
    userMessage: COPY.config.userMessage,
    adminHint: COPY.config.adminHint,
    retryable: false,
    correlationId: newCorrelationId(),
    isGeneric: true,
    technical: detail,
    cause: new Error(detail),
  };
}

/**
 * The single string to show in a toast. Admins additionally get the resolution
 * hint and the reference id; clients get only their own message.
 */
export function messageForViewer(error: AppError, isAdmin: boolean): string {
  if (!isAdmin) return error.userMessage;
  return `${error.userMessage} - ${error.adminHint} (ref ${error.correlationId})`;
}
