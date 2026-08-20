import { Component, type ErrorInfo, type ReactNode } from "react";
import { type AppError, normalizeError } from "../../lib/errors";
import { reportError } from "../../lib/observability";
import AppErrorFallback from "./AppErrorFallback";

type Props = {
  children: ReactNode;
  /** Tagged on the Sentry issue so we know which boundary caught it. */
  source?: string;
  /** Custom fallback. Defaults to the standard full-page error screen. */
  fallback?: (error: AppError, reset: () => void) => ReactNode;
  variant?: "page" | "inline";
  onReset?: () => void;
  /**
   * Clears a displayed error whenever this value changes (the current route,
   * typically). Children are not remounted, so layout state survives.
   */
  resetKey?: string;
};

type State = { error: AppError | null };

/**
 * A render-error boundary.
 *
 * Written as a class (React offers no hook equivalent) and kept free of router,
 * theme and data-layer dependencies so it still works when the thing that broke
 * is one of those.
 */
const LAST_RELOAD_KEY = "app:last-chunk-reload";
const RELOAD_COOLDOWN_MS = 30_000;

/**
 * Reload once when a stale build is detected, but never in a loop: if we
 * already reloaded moments ago, show the error instead of cycling.
 */
function tryReloadForStaleBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(LAST_RELOAD_KEY) ?? "0");
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    // Storage unavailable (private mode, blocked cookies): do not risk a loop.
    return false;
  }
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(cause: unknown): State {
    // Render the fallback immediately; componentDidCatch replaces this with
    // the reported error so the id on screen matches the id in Sentry.
    return { error: normalizeError(cause) };
  }

  componentDidCatch(cause: unknown, info: ErrorInfo) {
    const error = reportError(cause, {
      source: this.props.source ?? "error-boundary",
      componentStack: info.componentStack ?? undefined,
    });

    if (error.kind === "chunkLoad" && tryReloadForStaleBuild()) {
      // A reload is in flight; leave the fallback on screen until it lands.
      return;
    }

    this.setState({ error });
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.state.error &&
      this.props.resetKey !== undefined &&
      this.props.resetKey !== prevProps.resetKey
    ) {
      this.setState({ error: null });
    }
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <AppErrorFallback
        error={error}
        onRetry={this.reset}
        variant={this.props.variant ?? "page"}
      />
    );
  }
}
