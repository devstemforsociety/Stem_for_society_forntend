/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_ANON_KEY: string;
	readonly VITE_BACKEND_URL?: string;
	readonly VITE_RZPY_KEYID?: string;

	/* Observability (Sentry). All optional - omitting the DSN disables it. */
	readonly VITE_SENTRY_DSN?: string;
	readonly VITE_SENTRY_ENVIRONMENT?: string;
	readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
	readonly VITE_SENTRY_REPLAY?: string;
	readonly VITE_APP_VERSION?: string;

	/* Send X-Correlation-Id on API requests. Requires the API to whitelist
	   that header in its CORS allowedHeaders first. */
	readonly VITE_SEND_CORRELATION_HEADER?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
