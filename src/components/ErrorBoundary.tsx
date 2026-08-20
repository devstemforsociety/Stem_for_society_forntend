import AppErrorBoundary from "./error/AppErrorBoundary";

/**
 * Kept for existing imports. Delegates to the app boundary, which reports to
 * observability and - unlike the previous implementation - never renders the
 * error message and stack trace to visitors.
 */
export default function ErrorBoundary({ children }: React.PropsWithChildren) {
  return <AppErrorBoundary source="root">{children}</AppErrorBoundary>;
}
