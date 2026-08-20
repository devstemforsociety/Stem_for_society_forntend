import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import AppErrorBoundary from "./AppErrorBoundary";

/**
 * Boundary for a routed screen.
 *
 * Place this *inside* a layout, around its `<Outlet />`, so that a crashing
 * page only replaces the content region - the header, sidebar and footer stay
 * on screen and the visitor can simply navigate somewhere else. Defaulting to
 * the `inline` variant keeps it looking like part of the site rather than a
 * standalone error page.
 *
 * Navigating away clears the error automatically. The reset is driven by
 * `resetKey` rather than `key`, so healthy pages and their layouts are never
 * remounted just because we are watching them.
 */
export default function RouteErrorBoundary({
  children,
  variant = "inline",
  source = "route",
}: {
  children: ReactNode;
  variant?: "page" | "inline";
  source?: string;
}) {
  const location = useLocation();

  return (
    <AppErrorBoundary
      source={source}
      variant={variant}
      resetKey={location.pathname}
    >
      {children}
    </AppErrorBoundary>
  );
}
