import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../Constants";
import { reportApiFailure, reportApiSuccess } from "./connectivity";
import { newCorrelationId, normalizeError } from "./errors";
import { reportError } from "./observability";
import { UserAuthResponse } from "./types";

/** Requests that hang forever look identical to a frozen UI. Cap them. */
const REQUEST_TIMEOUT_MS = 20_000;

const AUTH_STORAGE_KEYS = ["studentAuth", "partnerAuth", "adminAuth"] as const;

/**
 * React Query cache key -> localStorage key.
 *
 * These two names disagree only for the student ("auth" vs "studentAuth"),
 * which is why the fallback below used to be hardcoded to "studentAuth" - and
 * so partner and admin had no fallback at all. On a hard refresh, any request
 * firing before the auth query reseeded the cache went out with no token,
 * came back 401, and logged the user straight out.
 */
const STORAGE_KEY_FOR_QUERY_KEY: Record<string, string> = {
  auth: "studentAuth",
  partnerAuth: "partnerAuth",
  adminAuth: "adminAuth",
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Retry only what can plausibly succeed on a second attempt. The default
       * policy retries everything three times, which turns a 404 into four
       * requests and delays the error the user is waiting for.
       */
      retry: (failureCount, error) =>
        normalizeError(error).retryable && failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      // Mutations are rarely idempotent - never replay them automatically.
      retry: false,
    },
  },
  /* Every failed query and mutation reaches observability, whatever the
     call site does about it visually. */
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportError(error, {
        source: "query",
        extra: { queryKey: JSON.stringify(query.queryKey).slice(0, 200) },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      reportError(error, {
        source: "mutation",
        extra: {
          mutationKey: mutation.options.mutationKey
            ? JSON.stringify(mutation.options.mutationKey).slice(0, 200)
            : "anonymous",
        },
      });
    },
  }),
});

export function clearAuthStorage() {
  for (const key of AUTH_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage may be unavailable; nothing else to do */
    }
  }
}

const api = (queryKeyName: string = "auth") => {
  const api = axios.create({
    baseURL: API_URL,
    timeout: REQUEST_TIMEOUT_MS,
  });

  api.interceptors.request.use((config) => {
    // First try to get token from React Query cache
    let token = queryClient.getQueryData<UserAuthResponse>([
      queryKeyName,
    ])?.token;

    // Fallback to localStorage if not in cache, using the key that belongs to
    // whichever role this client was created for.
    if (!token) {
      const storageKey = STORAGE_KEY_FOR_QUERY_KEY[queryKeyName];
      const stored = storageKey ? localStorage.getItem(storageKey) : null;
      if (stored && storageKey) {
        try {
          const parsed = JSON.parse(stored);
          token = parsed.token;
        } catch {
          // Invalid JSON in localStorage
          localStorage.removeItem(storageKey);
          token = null;
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    /**
     * Lets a backend log line be matched to the reference id the user sees.
     *
     * Off by default, and deliberately so: the API lists its allowed headers
     * explicitly, so sending a header it has not whitelisted fails CORS
     * preflight and breaks *every* request. Deploy the API with
     * "X-Correlation-Id" in `allowedHeaders` first, then set
     * VITE_SEND_CORRELATION_HEADER=true here.
     */
    if (import.meta.env.VITE_SEND_CORRELATION_HEADER === "true") {
      config.headers["X-Correlation-Id"] = newCorrelationId();
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => {
      reportApiSuccess();
      return response;
    },
    (error) => {
      const appError = normalizeError(error);
      reportApiFailure(appError.kind);

      // A 401 from a sign-in endpoint means the submitted credentials were
      // rejected, not that an existing session lapsed. Treating it as expiry
      // bounces the visitor off the very form they are using: /partner-signin
      // does not match the onAuthScreen test below, so it would redirect to
      // /login mid-attempt.
      const isSignInRequest = /\/auth\/sign-in\/?$/.test(
        error?.config?.url ?? "",
      );

      if (appError.kind === "unauthorized" && !isSignInRequest) {
        // Drop only our own session keys. `localStorage.clear()` also wiped
        // unrelated app state (drafts, preferences) on every expiry.
        queryClient.clear();
        clearAuthStorage();

        // Redirecting while already on a sign-in screen produces a reload loop.
        const path = window.location.pathname;
        const onAuthScreen = /\/(login|signin|signup)/i.test(path);

        if (!onAuthScreen) {
          const returnTo = encodeURIComponent(
            `${path}${window.location.search}${window.location.hash}`,
          );
          window.location.href = `/login?returnTo=${returnTo}`;
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
};
export { api };
