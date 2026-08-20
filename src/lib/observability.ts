/**
 * Observability (Sentry).
 *
 * Design rules, in priority order:
 *
 *  1. Observability must never take the site down. Sentry is loaded lazily in
 *     its own chunk; if the DSN is absent or the chunk fails to download, every
 *     function here quietly degrades to a no-op.
 *  2. No secrets or PII leave the browser. Tokens, cookies, auth headers and
 *     query strings are stripped in `beforeSend`.
 *  3. The free tier must last. Tracing is sampled at 10% and session replay is
 *     off unless explicitly enabled, so a busy day cannot exhaust the quota.
 *
 * Configure with (all optional - omitting the DSN disables reporting):
 *   VITE_SENTRY_DSN=https://...ingest.sentry.io/...
 *   VITE_SENTRY_ENVIRONMENT=production
 *   VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
 *   VITE_SENTRY_REPLAY=false
 *   VITE_APP_VERSION=<git sha>
 */
import type { AppError } from "./errors";
import { normalizeError } from "./errors";
import { getViewerIdentity } from "./viewer";

type SentryModule = typeof import("@sentry/react");

let sentry: SentryModule | null = null;
let loadStarted = false;
/** Calls made before the SDK finished loading, replayed once it is ready. */
const pending: Array<() => void> = [];
const MAX_PENDING = 50;

export function isObservabilityEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SENTRY_DSN);
}

function run(action: () => void): void {
  if (sentry) {
    try {
      action();
    } catch {
      /* never let reporting throw into app code */
    }
    return;
  }
  if (loadStarted && pending.length < MAX_PENDING) {
    pending.push(action);
  }
}

function flushPending(): void {
  while (pending.length > 0) {
    const action = pending.shift();
    try {
      action?.();
    } catch {
      /* ignore */
    }
  }
}

type Bag = Record<string, unknown>;

/** Strip anything sensitive from an outgoing event, in place. */
function scrub(event: Bag): void {
  const request = event.request as Bag | undefined;
  if (request) {
    delete request.cookies;

    const headers = request.headers as Bag | undefined;
    if (headers) {
      delete headers.Authorization;
      delete headers.authorization;
      delete headers.Cookie;
      delete headers.cookie;
    }

    // Query strings can carry returnTo paths, tokens and email addresses.
    if (typeof request.url === "string") {
      request.url = request.url.split("?")[0];
    }
    delete request.query_string;
  }

  const user = event.user as Bag | undefined;
  if (user) {
    delete user.email;
    delete user.ip_address;
    delete user.username;
  }
}

/** Noise we never want to spend free-tier quota on. */
const IGNORED_ERRORS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "Non-Error promise rejection captured",
  "AbortError",
  // Browsers report these when a user navigates away mid-request.
  "Network request failed",
  "cancelled",
];

const DENIED_URLS = [
  /extensions\//i,
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
];

/**
 * Start Sentry. Safe to call once at boot, before anything else; it never
 * throws and never blocks rendering.
 */
export function initObservability(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || loadStarted) return;

  loadStarted = true;

  import("@sentry/react")
    .then((mod) => {
      const tracesSampleRate = Number(
        import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
      );
      const replayEnabled =
        String(import.meta.env.VITE_SENTRY_REPLAY ?? "false") === "true";

      mod.init({
        dsn,
        environment:
          import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
        release: import.meta.env.VITE_APP_VERSION || undefined,
        integrations: [
          mod.browserTracingIntegration(),
          ...(replayEnabled
            ? [mod.replayIntegration({ maskAllText: true, blockAllMedia: true })]
            : []),
        ],
        tracesSampleRate: Number.isFinite(tracesSampleRate)
          ? tracesSampleRate
          : 0.1,
        // Replays are the scarcest free-tier resource: capture them only for
        // sessions that actually errored, and only when explicitly turned on.
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: replayEnabled ? 1 : 0,
        sendDefaultPii: false,
        ignoreErrors: IGNORED_ERRORS,
        denyUrls: DENIED_URLS,
        beforeSend: (event) => {
          scrub(event as unknown as Bag);
          return event;
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Console breadcrumbs frequently contain full response payloads.
          if (breadcrumb.category === "console") return null;
          if (typeof breadcrumb.data?.url === "string") {
            breadcrumb.data.url = breadcrumb.data.url.split("?")[0];
          }
          return breadcrumb;
        },
      });

      sentry = mod;
      identifyViewer();
      flushPending();
    })
    .catch(() => {
      // The SDK chunk failed to load. The app carries on without reporting.
      loadStarted = false;
      pending.length = 0;
    });
}

/** Attach the current (non-PII) viewer identity to subsequent events. */
export function identifyViewer(): void {
  const identity = getViewerIdentity();
  run(() => {
    // Id only - no email, name or IP. The role travels as a tag instead.
    sentry?.setUser(identity.id ? { id: identity.id } : null);
    sentry?.setTag("viewer.role", identity.role);
  });
}

export function clearViewerIdentity(): void {
  run(() => sentry?.setUser(null));
}

export type ReportContext = {
  /** Where in the UI this happened, e.g. "route-boundary" or "mutation". */
  source?: string;
  /** Extra non-sensitive detail for the Sentry issue. */
  extra?: Record<string, unknown>;
  /** React component stack, when reported from an error boundary. */
  componentStack?: string;
};

/**
 * Report a failure. Accepts a raw thrown value or an already-normalized
 * AppError, and returns the AppError so callers can render from it.
 */
export function reportError(
  cause: unknown,
  context: ReportContext = {},
): AppError {
  const error = normalizeError(cause);

  // Expected, self-explanatory conditions are not worth free-tier quota:
  // a dropped connection or an expired session is not a bug to fix.
  const notWorthReporting: AppError["kind"][] = [
    "offline",
    "unauthorized",
    "notFound",
    "validation",
  ];
  const shouldReport = !notWorthReporting.includes(error.kind);

  if (import.meta.env.DEV) {
    console.error(
      `[${error.code}] ${error.technical || error.userMessage} (ref ${error.correlationId})`,
      error.cause,
    );
  }

  if (shouldReport) {
    run(() => {
      sentry?.withScope((scope) => {
        scope.setTag("error.kind", error.kind);
        scope.setTag("error.code", error.code);
        scope.setTag("correlation_id", error.correlationId);
        if (error.status) scope.setTag("http.status", String(error.status));
        if (context.source) scope.setTag("source", context.source);
        scope.setLevel(error.kind === "server" ? "error" : "warning");
        scope.setContext("app_error", {
          kind: error.kind,
          code: error.code,
          status: error.status ?? null,
          technical: error.technical,
          correlationId: error.correlationId,
          ...context.extra,
        });
        if (context.componentStack) {
          scope.setContext("react", {
            componentStack: context.componentStack,
          });
        }
        sentry?.captureException(
          error.cause instanceof Error ? error.cause : new Error(error.technical || error.code),
        );
      });
    });
  }

  return error;
}

/** Leave a trail of what the user did before an error, for the Sentry issue. */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
): void {
  run(() =>
    sentry?.addBreadcrumb({ message, data, level: "info", category: "app" }),
  );
}
