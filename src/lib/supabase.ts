import { createClient } from "@supabase/supabase-js";
import { getEnv, isSupabaseConfigured } from "./env";

const env = getEnv();

/**
 * `createClient` throws if the URL is blank, and this module is imported by the
 * auth hooks that nearly every page pulls in - so throwing here would take the
 * entire site down over one missing variable. When the config is absent we
 * build the client against an unroutable placeholder instead: public pages keep
 * working, and Supabase-backed calls fail as ordinary handled errors.
 */
const configured = isSupabaseConfigured();

export const supabaseConfigured = configured;

export const supabase = createClient(
  configured ? env.VITE_SUPABASE_URL : "https://unconfigured.invalid",
  configured ? env.VITE_SUPABASE_ANON_KEY : "unconfigured",
  {
    auth: {
      persistSession: configured,
      autoRefreshToken: configured,
      detectSessionInUrl: configured,
    },
  },
);
