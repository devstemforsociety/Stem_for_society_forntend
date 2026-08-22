import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Puts a newly opened page at the top.
 *
 * A single-page app keeps the window's scroll offset across route changes, so
 * following a link from halfway down one page dropped you into the middle of
 * the next one - the reader has to scroll up to find the heading they just
 * asked for.
 *
 * Renders nothing; it exists for the effect.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    /**
     * Back and forward are excluded on purpose. Returning to a listing should
     * land where you left it, and the browser already restores that - forcing
     * the top here would undo it.
     */
    if (navigationType === "POP") return;

    /** A link to #section is asking for that element, not the top. */
    if (hash) return;

    /**
     * Reset every element that could be the scroller.
     *
     * index.css gives html and body height: 100%, which moves the scroll onto
     * <body> - so window.scrollTo() alone does nothing on most of this site.
     * The partner and admin layouts scroll an inner <main> instead. Rather
     * than guess, clear all of them; resetting one already at 0 costs nothing.
     */
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const candidates = [
      document.documentElement,
      document.body,
      document.querySelector("main"),
    ];

    for (const element of candidates) {
      if (element && element.scrollTop > 0) {
        element.scrollTop = 0;
      }
    }
  }, [pathname, hash, navigationType]);

  return null;
}
