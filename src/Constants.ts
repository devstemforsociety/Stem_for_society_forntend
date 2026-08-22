/**
 * Base URL of the API. Set VITE_BACKEND_URL per environment; the localhost
 * default is only meaningful for a developer running the API alongside Vite.
 */
export const API_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";

export const RZPY_KEYID = import.meta.env.VITE_RZPY_KEYID ?? "";
export const INVALID_SESSION_MSG = "Invalid session, please login again";
