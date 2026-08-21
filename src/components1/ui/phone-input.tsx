import * as React from "react";

import { Input } from "@/components1/ui/input";
import { cn } from "@/lib/utils";

/**
 * An Indian mobile number field with a fixed +91 prefix.
 *
 * The prefix is presentation only. Every mobile field on the API validates
 * against /^[6789]\d{9}$/ - ten digits, no country code - so the value handed
 * back to `onChange` stays the bare ten digits. Including "+91" in the value
 * would fail validation on every single submission.
 *
 * Input is sanitised as it is typed: anything non-numeric is dropped, a
 * pasted "+91" or leading zero is stripped, and the result is capped at ten
 * digits. That means a number pasted from a contact card in any of the usual
 * shapes ("+91 98765 43210", "098765 43210") lands correctly instead of being
 * rejected after submit.
 */
const PhoneInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type" | "onChange" | "value"> & {
    value: string;
    /** Receives the bare 10-digit number, never the +91 prefix. */
    // Parameter name in a function type, not a binding - the unused-vars
    // rules cannot tell the difference.
    /* eslint-disable-next-line no-unused-vars */
    onChange: (digits: string) => void;
  }
>(({ className, value, onChange, id, ...props }, ref) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let digits = event.target.value.replace(/\D/g, "");
    // A pasted number may arrive with the country code or a trunk zero.
    if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
    onChange(digits.slice(0, 10));
  };

  return (
    <div className="relative flex items-stretch">
      <span
        // Decorative: the input's own label and description carry the meaning,
        // and a screen reader reading "plus nine one" mid-field is noise.
        aria-hidden="true"
        className="pointer-events-none flex select-none items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground"
      >
        +91
      </span>
      <Input
        {...props}
        id={id}
        ref={ref}
        type="tel"
        value={value}
        onChange={handleChange}
        // Numeric keypad on mobile without the spinner arrows a number input
        // would bring.
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={10}
        placeholder={props.placeholder ?? "10-digit mobile number"}
        className={cn("rounded-l-none", className)}
      />
    </div>
  );
});
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
