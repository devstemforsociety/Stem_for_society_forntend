import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { messageError, normalizeError } from "./errors";

/**
 * The rule these protect: a message shown to a visitor must never carry system
 * internals, and a 5xx body must never be shown at all - that is where stack
 * traces and driver errors leak from.
 */
function axiosErrorWith(status: number, data: unknown): AxiosError {
  const error = new AxiosError("Request failed");
  error.config = { headers: new AxiosHeaders(), url: "/things", method: "get" };
  error.response = {
    status,
    statusText: "",
    data,
    headers: {},
    config: error.config,
  };
  return error;
}

describe("normalizeError", () => {
  it("shows a deliberate 4xx message from the API", () => {
    const error = normalizeError(
      axiosErrorWith(401, { error: "Invalid credentials" }),
    );

    expect(error.kind).toBe("unauthorized");
    expect(error.userMessage).toBe("Invalid credentials");
    expect(error.isGeneric).toBe(false);
  });

  it("never shows a 5xx body, however harmless it looks", () => {
    const error = normalizeError(
      axiosErrorWith(500, { error: "Server error in registering !" }),
    );

    expect(error.kind).toBe("server");
    expect(error.userMessage).not.toContain("registering");
    expect(error.isGeneric).toBe(true);
    // The detail is still available for admins and Sentry.
    expect(error.technical).toContain("registering");
  });

  it("suppresses 4xx messages that leak internals", () => {
    const leaky = [
      "ECONNREFUSED 10.0.0.4:5432",
      "error at Object.query (/usr/src/app/db.js:22:11)",
      "postgres: relation users does not exist",
      "<!doctype html><html>...",
    ];

    for (const message of leaky) {
      const error = normalizeError(axiosErrorWith(400, { error: message }));
      expect(error.userMessage).not.toContain(message);
      expect(error.isGeneric).toBe(true);
    }
  });

  it("classifies a transport failure with no response", () => {
    const error = new AxiosError("Network Error");
    error.code = "ERR_NETWORK";
    error.config = { headers: new AxiosHeaders(), url: "/x", method: "get" };

    const normalized = normalizeError(error);
    expect(normalized.kind).toBe("network");
    expect(normalized.retryable).toBe(true);
  });

  it("marks non-retryable statuses so they are not replayed", () => {
    expect(normalizeError(axiosErrorWith(404, {})).retryable).toBe(false);
    expect(normalizeError(axiosErrorWith(403, {})).retryable).toBe(false);
    expect(normalizeError(axiosErrorWith(500, {})).retryable).toBe(true);
  });

  it("never trusts a native runtime error's message", () => {
    const error = normalizeError(
      new TypeError("Cannot read properties of undefined (reading 'id')"),
    );

    expect(error.userMessage).not.toContain("Cannot read properties");
    expect(error.isGeneric).toBe(true);
  });

  it("strips query strings from the technical detail", () => {
    const error = new AxiosError("Request failed");
    error.config = {
      headers: new AxiosHeaders(),
      url: "/reset?token=super-secret-value",
      method: "get",
    };
    error.code = "ERR_NETWORK";

    expect(normalizeError(error).technical).not.toContain("super-secret-value");
  });

  it("is idempotent", () => {
    const once = normalizeError(axiosErrorWith(404, {}));
    expect(normalizeError(once)).toBe(once);
  });
});

describe("messageError", () => {
  it("passes through a safe message", () => {
    expect(messageError("Booking already confirmed").userMessage).toBe(
      "Booking already confirmed",
    );
  });

  it("replaces one that leaks internals", () => {
    const error = messageError("at Module._compile (node:internal/modules)");
    expect(error.userMessage).not.toContain("Module._compile");
    expect(error.isGeneric).toBe(true);
  });
});
