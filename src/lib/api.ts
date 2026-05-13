import { QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "../Constants";
import { UserAuthResponse } from "./types";

export const queryClient = new QueryClient();

const api = (queryKeyName: string = "auth") => {
  const api = axios.create({
    baseURL: API_URL,
  });

  api.interceptors.request.use((config) => {
    // First try to get token from React Query cache
    let token = queryClient.getQueryData<UserAuthResponse>([
      queryKeyName,
    ])?.token;

    // Fallback to localStorage if not in cache
    if (!token) {
      const stored = localStorage.getItem("studentAuth");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          token = parsed.token;
        } catch {
          // Invalid JSON in localStorage
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear all session states
        queryClient.clear();
        localStorage.clear();
        
        // Force redirect to login
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return api;
};
export { api };
