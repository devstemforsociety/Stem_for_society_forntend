import { lazy, type ComponentType } from "react";
import { normalizeError } from "./errors";
import { addBreadcrumb } from "./observability";

/**
 * `React.lazy` with retries.
 *
 * Every page in this app is code-split, so a single failed chunk download is
 * enough to blank a route. That happens routinely for benign reasons - a flaky
 * connection, or a deploy that replaced the file while a tab was open - so we
 * retry with backoff before giving up and letting the error boundary handle it.
 */
// React.lazy itself is typed with `any` here; matching it keeps props inference.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  { retries = 2, delayMs = 350 }: { retries?: number; delayMs?: number } = {},
) {
  return lazy(() => loadWithRetry(factory, retries, delayMs));
}

async function loadWithRetry<T>(
  factory: () => Promise<T>,
  retries: number,
  delayMs: number,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await factory();
    } catch (cause) {
      lastError = cause;

      // Only transient download failures are worth retrying; a genuine
      // exception inside the module will fail identically every time.
      if (normalizeError(cause).kind !== "chunkLoad") throw cause;

      if (attempt < retries) {
        addBreadcrumb("Retrying failed chunk download", { attempt: attempt + 1 });
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * (attempt + 1)),
        );
      }
    }
  }

  throw lastError;
}
