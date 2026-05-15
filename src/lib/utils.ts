import { AxiosError } from "axios";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { GenericError } from "./types";
import { toast } from "react-toastify";
import { NavigateFunction } from "react-router-dom";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function sleep(time: number) {
  return await new Promise((res) => setTimeout(res, time));
}

// Simplified error handler - no session management
export function mutationErrorHandler(
  error: AxiosError<GenericError>,
  navigate?: NavigateFunction,
  path?: string,
) {
  console.error("mutation error:", error);
  
  const errorObject =
    typeof error.response?.data !== "string" && error.response?.data;
  const errorMessage =
    errorObject && "error" in errorObject && errorObject.error;
  const validationError =
    errorObject && "errors" in errorObject && errorObject.errors;

  // Handle 401 errors by redirecting to login
  if (error.status === 401) {
    toast.error('Authentication required');
    if (navigate) {
      navigate(path ?? "/");
    }
    return;
  }

  if (validationError) {
    validationError.forEach((err) => {
      toast.error(
        err.path[0].toUpperCase() + err.path.slice(1) + ": " + err.message,
      );
    });
    return;
  }

  const normalizedMessage = (errorMessage || error.message || "").trim();

  if (normalizedMessage.toLowerCase() === "invalid credentials") {
    toast.error("Invalid credentials.");
    return;
  }

  if (normalizedMessage.toLowerCase() === "user not found") {
    toast.error("User not Found! Please sign up first");
    return;
  }

  toast.error(normalizedMessage || "Unknown error");
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
  if (days <= 14) return days === 7 ? "one week" : `${Math.ceil(days / 7)} weeks`;
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
