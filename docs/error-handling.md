# Error handling & observability

The goal: **the frontend never goes down.** If the backend is unreachable, a
request fails, or a component throws, the site stays navigable and shows a
message that makes sense to whoever is reading it.

## The rules

1. **No blank screens.** Every failure has a boundary above it, up to and
   including a plain-HTML fallback in `index.html` if the bundle never loads.
2. **Clients see plain language.** Never a stack trace, file path, driver name,
   SQL fragment or hostname.
3. **Admins see the fix.** The same screen additionally shows how to resolve it,
   or - when it cannot be classified - "contact your developer" plus a
   reference id.
4. **Everything is reported once,** with a reference id the user can quote.

## Where things live

| File | Role |
| --- | --- |
| `src/lib/errors.ts` | The taxonomy. Turns anything thrown into an `AppError`. |
| `src/lib/observability.ts` | Sentry wrapper. No-op unless a DSN is set. |
| `src/lib/connectivity.ts` | Tracks whether the API is answering. |
| `src/lib/lazyWithRetry.ts` | `React.lazy` that retries failed chunk downloads. |
| `src/lib/viewer.ts` | Decides if the viewer is a client or an admin. |
| `src/components/error/AppErrorBoundary.tsx` | Catches render errors. |
| `src/components/error/RouteErrorBoundary.tsx` | Resets the error on navigation. |
| `src/components/error/AppErrorFallback.tsx` | The error screen itself. |
| `src/components/error/ErrorState.tsx` | Inline panel for one failed section. |
| `src/components/error/ConnectionBanner.tsx` | "We cannot reach our servers" bar. |

## Layers of protection

```
index.html boot fallback     -> bundle never downloaded
  main.tsx try/catch         -> React cannot mount
    ErrorBoundary (root)     -> anything below throws
      RouteErrorBoundary     -> one page throws; other pages stay fine
        ErrorState           -> one widget's request failed
```

Plus two global listeners in `main.tsx` for `unhandledrejection` and
`window.onerror`, which never reach a React boundary on their own.

## Using it in a page

```tsx
import ErrorState from "@/components/error/ErrorState";

const { data, error, isLoading, refetch } = useQuery({ ... });

if (isLoading) return <Loading />;
if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
```

`ErrorState` takes the raw error - it classifies it for you. For toasts inside
mutations, keep using `mutationErrorHandler(error)`; it now routes through the
same taxonomy.

## Error kinds

`normalizeError` classifies into: `offline`, `network`, `timeout`,
`unauthorized`, `forbidden`, `notFound`, `validation`, `conflict`,
`rateLimited`, `server`, `maintenance`, `chunkLoad`, `config`, `unknown`.

Two rules worth knowing:

- **4xx bodies may be shown** to users, but only after passing a safety filter
  (short, single line, no internals). These are messages your API deliberately
  wrote for a user, like "Invalid credentials".
- **5xx bodies are never shown.** That is where stack traces leak from. Users
  get generic copy; the real detail goes to Sentry.

## Setting up Sentry (free tier)

Sentry's free plan covers **5,000 errors and 50 replays per month** for one
user - comfortably enough for this app.

1. Create an account at <https://sentry.io> and add a project (platform:
   **React**).
2. Copy the DSN it gives you.
3. Set it wherever you deploy (Vercel / Netlify project settings, or `.env`):

   ```
   VITE_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
   VITE_SENTRY_ENVIRONMENT=production
   VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
   VITE_APP_VERSION=<git sha>
   ```

4. Redeploy.

Two things to remember about Vite: env vars must start with `VITE_`, and they
are **baked in at build time** - setting the DSN after a build does nothing, you
have to rebuild.

**Leaving `VITE_SENTRY_DSN` empty is fully supported.** The SDK is then dropped
from the bundle entirely at build time and every reporting call becomes a no-op.

### Quota protection

- Tracing is sampled at 10% (`VITE_SENTRY_TRACES_SAMPLE_RATE`).
- Session Replay is **off** by default (`VITE_SENTRY_REPLAY=false`) because 50
  replays/month is the tightest limit. Turn it on only while chasing a bug.
- Expected conditions - offline, expired session, 404, validation - are not
  reported at all. They are not bugs.
- Browser-extension noise and `ResizeObserver` warnings are filtered out.

### Privacy

`beforeSend` strips cookies, `Authorization` headers, query strings, email,
username and IP. Users are identified by database id and role only. Console
breadcrumbs are dropped because they often contain whole response payloads.

## Resolving an issue from a report

A user quotes a reference id (shown on every error screen, e.g. `aeb71bd6`).

1. Search Sentry for that id - it is on the issue as the `correlation_id` tag.
2. The `app_error` context has the kind, code, HTTP status and technical detail.
3. Optionally, the same id can be sent to the API as an `X-Correlation-Id`
   header so you can match it to a backend log line for the same request.

### Enabling the `X-Correlation-Id` header

This is **off by default**, and the order matters. The API lists its permitted
request headers explicitly in `corsOptions.allowedHeaders`; sending a header it
has not whitelisted fails the CORS preflight, which breaks *every* API call -
not just the one carrying the header.

1. Deploy the API with `"X-Correlation-Id"` in `allowedHeaders` (already added
   in `backend/src/index.ts`).
2. Only then set `VITE_SEND_CORRELATION_HEADER=true` and rebuild the frontend.

## Configuration is never fatal

Missing env vars are reported and logged, but do not stop the app. Supabase in
particular builds against a placeholder when unconfigured, so a missing key
breaks sign-in - not the entire public site.
