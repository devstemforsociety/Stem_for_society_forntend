import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Mode } from "@/pages/InstitutionOrIndividual";

interface ModeSwitchDialogProps {
  /** The mode the visitor is about to move to; null keeps the dialog closed. */
  pendingMode: Mode | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const COPY: Record<Mode, { title: string; body: string; cta: string }> = {
  individual: {
    title: "Switch to Individual?",
    body: "You will see services priced for one person - skill programs and training for students and working professionals.",
    cta: "Switch to Individual",
  },
  institution: {
    title: "Switch to Institutional?",
    body: "You will see plans built for schools, colleges and organisations - campus-wide programs, group pricing and partnership options rather than individual bookings.",
    cta: "Switch to Institutional",
  },
};

/**
 * Confirms a move between the Individual and Institutional views.
 *
 * The two sides show different services at different prices, so switching
 * silently made it easy to read institutional pricing as personal pricing (or
 * the reverse). Naming what changes before it changes is the point.
 */
const ModeSwitchDialog = ({
  pendingMode,
  onConfirm,
  onCancel,
}: ModeSwitchDialogProps) => {
  // Escape should dismiss, as with any modal.
  useEffect(() => {
    if (!pendingMode) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingMode, onCancel]);

  if (!pendingMode) return null;

  const copy = COPY[pendingMode];

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-switch-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <h2
          id="mode-switch-title"
          className="text-xl font-semibold text-gray-900"
        >
          {copy.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{copy.body}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Stay here
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="rounded-xl bg-[#0389FF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0272d6]"
          >
            {copy.cta}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ModeSwitchDialog;
