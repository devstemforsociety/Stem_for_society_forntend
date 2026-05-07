import { z } from "zod";

const envSchema = z
  .object({
    VITE_SUPABASE_URL: z.string().min(1),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
  })
  .passthrough();

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(import.meta.env);
  }

  return cachedEnv;
}

export function validateEnv(): void {
  envSchema.parse(import.meta.env);
}
