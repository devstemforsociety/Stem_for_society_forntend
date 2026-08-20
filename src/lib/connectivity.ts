/**
 * Connectivity state for the whole app.
 *
 * Rather than polling a health endpoint (which adds load and assumes a route
 * that may not exist), we infer reachability from the requests the app is
 * already making: the axios interceptors report every outcome here, and the
 * state flips back to healthy as soon as any request succeeds.
 */
import type { ErrorKind } from "./errors";

export type ConnectivityState = {
  /** navigator.onLine - the device has no network at all. */
  browserOnline: boolean;
  /** Our API answered the last time we tried. */
  apiReachable: boolean;
  /** When the API last failed to answer, for "retrying" copy. */
  lastFailureAt: number | null;
};

let state: ConnectivityState = {
  browserOnline:
    typeof navigator === "undefined" ? true : navigator.onLine !== false,
  apiReachable: true,
  lastFailureAt: null,
};

const listeners = new Set<() => void>();

function setState(patch: Partial<ConnectivityState>): void {
  const next = { ...state, ...patch };
  if (
    next.browserOnline === state.browserOnline &&
    next.apiReachable === state.apiReachable &&
    next.lastFailureAt === state.lastFailureAt
  ) {
    return;
  }
  // Identity only changes when something really changed, which keeps
  // useSyncExternalStore from looping.
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeConnectivity(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConnectivitySnapshot(): ConnectivityState {
  return state;
}

/** Any successful response proves the API is up. */
export function reportApiSuccess(): void {
  setState({ apiReachable: true, lastFailureAt: null });
}

/** Only transport-level failures say anything about reachability. */
export function reportApiFailure(kind: ErrorKind): void {
  if (kind === "network" || kind === "timeout" || kind === "maintenance") {
    setState({ apiReachable: false, lastFailureAt: Date.now() });
  } else if (kind !== "offline") {
    // A 4xx/5xx is still proof the server answered.
    setState({ apiReachable: true, lastFailureAt: null });
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => setState({ browserOnline: true }));
  window.addEventListener("offline", () => setState({ browserOnline: false }));
}
