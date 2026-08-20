import { messageError } from "../lib/errors";
import AppErrorFallback from "./error/AppErrorFallback";

type Props = {
  message: string;
  onRetry?: () => void;
};

/**
 * Inline error panel kept at its original call signature so existing pages do
 * not need changing. The message now passes through the safety filter, so a raw
 * server string can no longer surface internals to a visitor.
 *
 * New code should prefer `components/error/ErrorState`, which takes the error
 * object itself and can therefore classify it properly.
 */
export default function Errorbox({ message, onRetry }: Props) {
  return (
    <AppErrorFallback
      error={messageError(message)}
      onRetry={onRetry}
      variant="inline"
      showHome={false}
    />
  );
}
