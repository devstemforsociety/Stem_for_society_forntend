export const API_URL = true
  ? // ? "https://stem-for-society-api-lnj3a.ondigitalocean.app"
    //"https://stem-society-api.onrender.com"
    import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001"
  : "http://localhost:3001";
// export const API_URL = "https://stem-for-society-api-lnj3a.ondigitalocean.app";

export const PAYMENT_MODE = "test";
export const RZPY_KEYID = import.meta.env.VITE_RZPY_KEYID ?? "";
export const INVALID_SESSION_MSG = "Invalid session, please login again";
