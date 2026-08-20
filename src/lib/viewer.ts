/**
 * Who is looking at the screen right now?
 *
 * Error UIs use this to decide how much detail to show. Clients see only the
 * plain-language message; admins (and anyone running a dev build) additionally
 * see the resolution hint and the technical detail.
 *
 * This is a presentation concern only - it decides how much text to render,
 * never what the user is allowed to do. Real authorization stays on the API.
 */

export type ViewerRole = "client" | "admin";

function readStoredRole(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: { role?: string } };
    return parsed?.user?.role ?? null;
  } catch {
    // Corrupt JSON in storage must never break an error screen.
    return null;
  }
}

export function getViewerRole(): ViewerRole {
  if (typeof window === "undefined") return "client";
  return readStoredRole("adminAuth") === "ADMIN" ? "admin" : "client";
}

/**
 * True when the extra diagnostic detail should be rendered: a signed-in admin,
 * or any developer running the app locally.
 */
export function isPrivilegedViewer(): boolean {
  return import.meta.env.DEV || getViewerRole() === "admin";
}

/** Non-PII identity attached to observability events. */
export function getViewerIdentity(): {
  id?: string;
  role: string;
} {
  if (typeof window === "undefined") return { role: "anonymous" };

  for (const [key, role] of [
    ["adminAuth", "admin"],
    ["partnerAuth", "partner"],
    ["studentAuth", "student"],
  ] as const) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { user?: { id?: string | number } };
      const id = parsed?.user?.id;
      return { id: id === undefined ? undefined : String(id), role };
    } catch {
      continue;
    }
  }

  return { role: "anonymous" };
}
