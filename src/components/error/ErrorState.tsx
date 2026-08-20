import { normalizeError } from "../../lib/errors";
import AppErrorFallback from "./AppErrorFallback";

/**
 * Inline error panel for a section that failed while the rest of the page is
 * fine - a list that could not load, a widget whose request failed.
 *
 * Accepts a raw thrown value (an AxiosError from React Query, for example) and
 * normalizes it, so call sites do not have to know the error taxonomy.
 */
export default function ErrorState({
  error,
  onRetry,
  variant = "inline",
}: {
  error: unknown;
  onRetry?: () => void;
  variant?: "page" | "inline";
}) {
  return (
    <AppErrorFallback
      error={normalizeError(error)}
      onRetry={onRetry}
      variant={variant}
      showHome={false}
    />
  );
}
