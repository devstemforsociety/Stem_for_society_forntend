import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitizeHtml";

/**
 * Guards SFS-01 and SFS-10. Blog and lesson bodies are author-supplied HTML
 * rendered with `dangerouslySetInnerHTML`; anything that executes here reaches
 * an admin's session token.
 */
describe("sanitizeHtml", () => {
  const attacks = [
    ['inline event handler', '<img src=x onerror="alert(1)">'],
    ["script element", '<script>alert(1)</script>'],
    ["javascript: URL", '<a href="javascript:alert(1)">click</a>'],
    ["svg animate vector", "<svg><animate onbegin=alert(1) attributeName=x></svg>"],
    ["iframe", '<iframe src="https://evil.example"></iframe>'],
    ["object embed", '<object data="evil.swf"></object>'],
    ["form hijack", '<form action="https://evil.example"><input name="p"></form>'],
    ["style element", "<style>body{display:none}</style>"],
    ["srcdoc", '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
    ["base tag", '<base href="https://evil.example/">'],
  ] as const;

  it.each(attacks)("neutralises %s", (_name, payload) => {
    const output = sanitizeHtml(payload);

    expect(output).not.toMatch(/<script/i);
    expect(output).not.toMatch(/onerror|onbegin|onload|onclick/i);
    expect(output).not.toMatch(/javascript:/i);
    expect(output).not.toMatch(/<iframe|<object|<embed|<form|<style|<base/i);
    expect(output).not.toMatch(/srcdoc/i);
  });

  it("keeps legitimate rich-text formatting intact", () => {
    const content =
      '<p><strong>Bold</strong> and <em>italic</em> with a ' +
      '<a href="https://example.com">link</a>.</p>' +
      "<ul><li>One</li><li>Two</li></ul>" +
      "<h2>A heading</h2><blockquote>A quote</blockquote>";

    const output = sanitizeHtml(content);

    expect(output).toContain("<strong>Bold</strong>");
    expect(output).toContain("<em>italic</em>");
    expect(output).toContain('href="https://example.com"');
    expect(output).toContain("<li>One</li>");
    expect(output).toContain("<h2>A heading</h2>");
    expect(output).toContain("<blockquote>A quote</blockquote>");
  });

  it("keeps images but drops their handlers", () => {
    const output = sanitizeHtml(
      '<img src="https://cdn.example/a.png" alt="A" onerror="alert(1)">',
    );

    expect(output).toContain('src="https://cdn.example/a.png"');
    expect(output).toContain('alt="A"');
    expect(output).not.toMatch(/onerror/i);
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
  });
});
