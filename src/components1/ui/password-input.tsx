import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components1/ui/input";
import { cn } from "@/lib/utils";

/**
 * A password field with a reveal toggle.
 *
 * Typing a password blind is the single biggest cause of failed sign-ins, and
 * it is worse on phones where autocorrect and shifted keyboards hide what went
 * wrong. The toggle is a real <button type="button"> rather than an icon with
 * a click handler so it is reachable by keyboard and announced properly; the
 * accessible name states the action, and aria-pressed carries the state.
 *
 * type="button" matters: inside a <form> a bare <button> submits, so tapping
 * the eye would have posted a half-typed password.
 */
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        // Never let a revealed password be captured by the browser's
        // spellchecker or autocorrect.
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        // The input already announces itself; this control is decorative to a
        // screen reader beyond its own label.
        tabIndex={0}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
