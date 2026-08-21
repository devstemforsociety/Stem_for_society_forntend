import "@mantine/carousel/styles.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
// Load Poppins font from NPM package for consistent usage
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { getMissingRequired } from "./lib/env";
import { configError, normalizeError } from "./lib/errors";
import { initObservability, reportError } from "./lib/observability";
import "./index.css";

/* Start reporting before anything else, so failures during boot are captured. */
initObservability();

/**
 * Catch the two classes of error that escape React entirely. Without these an
 * unhandled rejection is invisible - it never reaches an error boundary.
 */
window.addEventListener("unhandledrejection", (event) => {
  reportError(event.reason, { source: "unhandledrejection" });
});

window.addEventListener("error", (event) => {
  // Resource load failures (img/script) arrive here with no `error` object.
  if (!event.error) return;
  reportError(event.error, { source: "window.onerror" });
});

/**
 * Missing configuration is reported, but never blocks rendering: the public
 * site must stay up even if, say, the Supabase keys were left out of a deploy.
 * Only the features that need the variable degrade.
 */
const missingEnv = getMissingRequired();
if (missingEnv.length > 0) {
  reportError(
    configError(
      missingEnv.map((entry) => `${entry.key} (${entry.impact})`).join(" | "),
    ),
    { source: "boot" },
  );

  if (import.meta.env.DEV) {
    console.error(
      "[config] Missing required environment variables:\n" +
        missingEnv.map((e) => `  - ${e.key}: ${e.impact}`).join("\n"),
    );
  }
}

/**
 * Last line of defence. If React cannot mount at all there is no boundary to
 * catch it, so we write plain HTML into the page rather than leaving the
 * visitor staring at a blank screen.
 */
function renderBootFailure(container: HTMLElement, reference: string): void {
  // Built with DOM calls rather than an HTML string with an inline `onclick`,
  // so the page still works under a Content-Security-Policy that forbids
  // inline script.
  container.textContent = "";

  const panel = document.createElement("div");
  panel.style.cssText =
    "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Poppins',system-ui,sans-serif;background:#f8fafc";

  const inner = document.createElement("div");
  inner.style.cssText = "max-width:520px;text-align:center";

  const heading = document.createElement("h1");
  heading.style.cssText =
    "font-size:20px;font-weight:600;color:#0f172a;margin:0 0 12px";
  heading.textContent = "We could not load the page";

  const detail = document.createElement("p");
  detail.style.cssText = "color:#475569;line-height:1.6;margin:0 0 20px";
  detail.textContent =
    "Something went wrong while starting the site. Please reload - if it keeps happening, contact support and quote the reference below.";

  const button = document.createElement("button");
  button.type = "button";
  button.style.cssText =
    "border:0;border-radius:999px;background:#0f172a;color:#fff;padding:10px 22px;font-size:14px;cursor:pointer";
  button.textContent = "Reload page";
  button.addEventListener("click", () => window.location.reload());

  const ref = document.createElement("p");
  ref.style.cssText = "color:#94a3b8;font-size:12px;margin-top:18px";
  ref.append("Reference: ");
  const refValue = document.createElement("span");
  refValue.style.cssText = "font-family:ui-monospace,monospace";
  refValue.textContent = reference;
  ref.appendChild(refValue);

  inner.append(heading, detail, button, ref);
  panel.appendChild(inner);
  container.appendChild(panel);
}

const container = document.getElementById("root");

if (!container) {
  // Nothing we can mount into; report so the broken deploy is visible.
  reportError(new Error("Root container #root not found in document"), {
    source: "boot",
  });
} else {
  try {
    createRoot(container).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    );
  } catch (cause) {
    const error = reportError(cause, { source: "boot" });
    renderBootFailure(container, error.correlationId);
  }
}

/* Surface an early failure of the module graph itself (e.g. a stale chunk). */
window.addEventListener("vite:preloadError", (event) => {
  const payload = (event as unknown as { payload?: unknown }).payload;
  reportError(normalizeError(payload ?? event), { source: "vite:preloadError" });
});
