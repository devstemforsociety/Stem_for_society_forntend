import { AxiosError } from "axios";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeError } from "../lib/errors";
import { GenericError } from "../lib/types";
import ErrorState from "./error/ErrorState";

export default function PartnerErrorHandler({
  error,
  onRetry,
}: {
  error: AxiosError<GenericError>;
  onRetry?: () => void;
}) {
  const navigate = useNavigate();
  const appError = useMemo(() => normalizeError(error), [error]);
  const sessionExpired = appError.kind === "unauthorized";

  // Navigation is a side effect: doing it during render (as this component
  // previously did) can fire repeatedly and warns in React 18.
  useEffect(() => {
    if (sessionExpired) {
      navigate("/partner/signin", { replace: true });
    }
  }, [sessionExpired, navigate]);

  if (sessionExpired) return null;

  return <ErrorState error={error} onRetry={onRetry} />;
}
