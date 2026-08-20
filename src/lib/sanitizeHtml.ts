import DOMPurify from "dompurify";

/**
 * Sanitize rich-text HTML before rendering it.
 *
 * Blog bodies and lesson content are authored through the rich-text editor and
 * stored as raw HTML, then rendered with `dangerouslySetInnerHTML`. Rendering
 * that unfiltered let an author run script in a reader's browser - including an
 * admin reviewing the submission, whose session token is readable from
 * localStorage (SFS-01, SFS-10).
 *
 * Always route user-authored HTML through this helper. Never call
 * `dangerouslySetInnerHTML` with a raw value.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    // Standard HTML only. Excludes SVG and MathML, both of which carry their
    // own script-execution vectors.
    USE_PROFILES: { html: true },
    // DOMPurify already strips these; listing them keeps the intent explicit
    // and survives someone loosening the profile later.
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
      "button",
      "base",
    ],
    FORBID_ATTR: ["formaction", "srcdoc"],
  });
}
