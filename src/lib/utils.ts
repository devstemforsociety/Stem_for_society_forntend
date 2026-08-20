import { AxiosError } from "axios";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { GenericError } from "./types";
import { toast, type ToastOptions } from "react-toastify";
import { NavigateFunction } from "react-router-dom";
import dayjs from "dayjs";
import { type AppError, messageForViewer, normalizeError } from "./errors";
import { isPrivilegedViewer } from "./viewer";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function sleep(time: number) {
  return await new Promise((res) => setTimeout(res, time));
}

/**
 * Show a failure as a toast, classified through the error taxonomy.
 *
 * Use this instead of `toast.error(someError.message)`: a raw message can be a
 * runtime bug ("Cannot read properties of undefined") or leak internals, and it
 * cannot tell a visitor that the server is simply unreachable.
 *
 * `fallback` is only used when the error carries no usable message of its own -
 * a classified failure (offline, timeout, rate limited) always wins, because
 * its copy is more specific than anything a call site can know in advance.
 */
export function toastError(
  cause: unknown,
  fallback?: string,
  options?: ToastOptions,
): AppError {
  const appError = normalizeError(cause);

  const base =
    appError.isGeneric && appError.kind === "unknown" && fallback
      ? fallback
      : appError.userMessage;

  const message = isPrivilegedViewer()
    ? `${base} - ${appError.adminHint} (ref ${appError.correlationId})`
    : base;

  toast.error(message, options);
  return appError;
}

/**
 * The app-wide toast handler for a failed mutation.
 *
 * All message selection is delegated to the error taxonomy, so a client sees
 * plain language while an admin also gets the resolution hint and reference id.
 * Reporting to observability already happened in the mutation cache, so this
 * function is purely presentational.
 */
export function mutationErrorHandler(
  error: AxiosError<GenericError>,
  navigate?: NavigateFunction,
  path?: string,
) {
  const appError = normalizeError(error);

  // Field-level problems are most useful listed one by one. Deduplicated:
  // a schema with two rules on the same field (min length + pattern, say) can
  // report the same message twice, which would stack identical toasts.
  if (appError.fieldErrors?.length) {
    const seen = new Set<string>();

    appError.fieldErrors.forEach((field) => {
      const label = field.path
        ? `${field.path.charAt(0).toUpperCase()}${field.path.slice(1)}: `
        : "";
      const message = label + field.message;

      if (seen.has(message)) return;
      seen.add(message);
      toast.error(message);
    });
    return;
  }

  if (appError.kind === "unauthorized") {
    toast.error(appError.userMessage);
    if (navigate) {
      navigate(path ?? "/");
    }
    return;
  }

  // Friendlier phrasing for the two most common sign-in rejections.
  const normalizedMessage = appError.userMessage.trim().toLowerCase();

  if (normalizedMessage === "invalid credentials") {
    toast.error("Invalid credentials.");
    return;
  }

  if (normalizedMessage === "user not found") {
    toast.error("User not Found! Please sign up first");
    return;
  }

  toast.error(messageForViewer(appError, isPrivilegedViewer()));
}

export function formatDate(date: string | Date | null) {
  return !date ? "No date" : dayjs(date).format("ddd, DD MMM YYYY");
}

export function calculateDuration(
  startDate?: string | Date | null,
  endDate?: string | Date | null,
  fallback = "6 months",
) {
  if (!startDate || !endDate) return fallback;

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  // Round up to avoid 0-day durations for same-day sessions.
  const days = Math.max(1, Math.ceil(end.diff(start, "day", true)));

  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  }

  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }

  return `${days} day${days > 1 ? "s" : ""}`;
}

export function calculateDurationForEmail(
  startDate?: string | Date | null,
  endDate?: string | Date | null,
  fallback = "six months",
) {
  if (!startDate || !endDate) return fallback;

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const days = Math.max(1, Math.ceil(end.diff(start, "day", true)));

  if (days === 1) return "one day";
  if (days <= 7) return `${days} days`;
  if (days <= 14)
    return days === 7 ? "one week" : `${Math.ceil(days / 7)} weeks`;
  if (days <= 30) return `${Math.ceil(days / 7)} weeks`;

  const months = Math.ceil(days / 30);
  return months === 1 ? "one month" : `${months} months`;
}

export function initializeRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});
