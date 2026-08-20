import {
  AlertTriangle,
  Lock,
  RefreshCw,
  RotateCcw,
  SearchX,
  Settings2,
  WifiOff,
} from "lucide-react";
import type { AppError, ErrorKind } from "../../lib/errors";
import { isPrivilegedViewer } from "../../lib/viewer";

/**
 * What a visitor sees when a component failed to render.
 *
 * Two very different situations, deliberately styled differently:
 *
 *  - `inline` (the normal case): the site chrome is intact around us, so this
 *    stays quiet and small - a short message and a single "Try again". It
 *    should read as part of the page, not as a crash screen. No "reload" or
 *    "go home" buttons: the site's own navigation is right there.
 *
 *  - `page` (last resort): the layout itself failed, so there is no chrome and
 *    no navigation. Only here do we offer reload, because nothing else is left.
 *
 * Built from plain elements and Tailwind only - no Mantine, no router hooks -
 * because it has to render even when the failure is *in* one of those.
 */

type Props = {
  error: AppError;
  /** Re-render the subtree that failed, without a full page load. */
  onRetry?: () => void;
  variant?: "page" | "inline";
  /** Offer "Go to homepage". Only meaningful in the `page` variant. */
  showHome?: boolean;
};

const PRESENTATION: Record<
  ErrorKind,
  { title: string; Icon: typeof AlertTriangle }
> = {
  offline: { title: "You are offline", Icon: WifiOff },
  network: { title: "We cannot reach our servers", Icon: WifiOff },
  timeout: { title: "That took too long", Icon: RotateCcw },
  unauthorized: { title: "Your session expired", Icon: Lock },
  forbidden: { title: "Access denied", Icon: Lock },
  notFound: { title: "Not found", Icon: SearchX },
  validation: { title: "Some details need fixing", Icon: AlertTriangle },
  conflict: { title: "That is already saved", Icon: AlertTriangle },
  rateLimited: { title: "Too many attempts", Icon: RotateCcw },
  server: { title: "Something went wrong", Icon: AlertTriangle },
  maintenance: { title: "Temporarily unavailable", Icon: Settings2 },
  chunkLoad: { title: "A new version is available", Icon: RefreshCw },
  config: { title: "Configuration problem", Icon: Settings2 },
  unknown: { title: "Something went wrong", Icon: AlertTriangle },
};

function AdminDiagnostics({ error }: { error: AppError }) {
  return (
    <details className="mt-5 w-full max-w-xl rounded-xl bg-slate-900 p-4 text-left text-slate-100">
      <summary className="cursor-pointer text-sm font-medium text-slate-200">
        Admin diagnostics
      </summary>
      <div className="mt-3 space-y-3 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            How to resolve
          </div>
          <p className="leading-relaxed text-slate-100">{error.adminHint}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400">Code: </span>
            <span className="font-mono">{error.code}</span>
          </div>
          <div>
            <span className="text-slate-400">Status: </span>
            <span className="font-mono">{error.status ?? "n/a"}</span>
          </div>
        </div>
        {error.technical && (
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Technical detail
            </div>
            <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs text-amber-200">
              {error.technical}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

function FieldErrors({ error }: { error: AppError }) {
  if (!error.fieldErrors?.length) return null;
  return (
    <ul className="list-disc ps-5 text-left text-sm text-slate-600">
      {error.fieldErrors.map((field) => (
        <li key={`${field.path}-${field.message}`}>
          <span className="font-medium">{field.path}</span>: {field.message}
        </li>
      ))}
    </ul>
  );
}

export default function AppErrorFallback({
  error,
  onRetry,
  variant = "page",
  showHome = true,
}: Props) {
  const { title, Icon } = PRESENTATION[error.kind] ?? PRESENTATION.unknown;
  const privileged = isPrivilegedViewer();

  if (variant === "inline") {
    return (
      <div
        className="flex w-full flex-col items-center gap-3 px-6 py-16 text-center"
        role="alert"
        aria-live="polite"
      >
        <Icon className="text-slate-400" size={26} strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="max-w-md text-sm leading-relaxed text-slate-500">
          {error.userMessage}
        </p>

        <FieldErrors error={error} />

        {onRetry && error.retryable && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw size={14} />
            Try again
          </button>
        )}

        <p className="text-xs text-slate-400">
          Reference{" "}
          <span className="font-mono text-slate-500">
            {error.correlationId}
          </span>
        </p>

        {privileged && <AdminDiagnostics error={error} />}
      </div>
    );
  }

  // Last resort: no site chrome exists around us.
  return (
    <div
      className="flex min-h-[70vh] items-center justify-center p-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <Icon className="text-slate-400" size={40} strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="max-w-md leading-relaxed text-slate-600">
          {error.userMessage}
        </p>

        <FieldErrors error={error} />

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {onRetry && error.retryable && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <RotateCcw size={15} />
              Try again
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Reload page
          </button>
          {showHome && (
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Go to homepage
            </a>
          )}
        </div>

        <p className="pt-1 text-xs text-slate-400">
          Reference{" "}
          <span className="font-mono text-slate-500">
            {error.correlationId}
          </span>
        </p>

        {privileged && <AdminDiagnostics error={error} />}
      </div>
    </div>
  );
}
