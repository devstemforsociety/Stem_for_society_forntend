import { RotateCcw, WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { queryClient } from "../../lib/api";
import {
  getConnectivitySnapshot,
  subscribeConnectivity,
} from "../../lib/connectivity";

/**
 * A persistent, non-blocking notice shown when the device is offline or the API
 * has stopped answering.
 *
 * It deliberately does not cover the page: cached content stays readable and
 * navigation keeps working, the visitor just knows why things are stale.
 */
export default function ConnectionBanner() {
  const { browserOnline, apiReachable } = useSyncExternalStore(
    subscribeConnectivity,
    getConnectivitySnapshot,
    getConnectivitySnapshot,
  );

  if (browserOnline && apiReachable) return null;

  const offline = !browserOnline;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[9999] flex flex-wrap items-center justify-center gap-3 bg-slate-900/95 px-4 py-3 text-sm text-white backdrop-blur"
    >
      <WifiOff size={16} className="shrink-0 text-amber-300" />
      <span className="text-center">
        {offline
          ? "You are offline. Some content may be out of date."
          : "We are having trouble reaching our servers. You can keep browsing - we will reconnect automatically."}
      </span>
      <button
        type="button"
        onClick={() => {
          void queryClient.refetchQueries({ type: "active" });
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium transition hover:bg-white/20"
      >
        <RotateCcw size={13} />
        Retry now
      </button>
    </div>
  );
}
