import test from "node:test";
import assert from "node:assert/strict";
import { fetchHTML } from "../src/lib/fetch.js";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("returns response html when status and content-type are valid", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
    text: async () => "<html><body>Hello</body></html>",
  });

  const html = await fetchHTML("https://example.com");
  assert.equal(html, "<html><body>Hello</body></html>");
});

test("throws when response status is not ok", async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => "service unavailable",
  });

  await assert.rejects(
    () => fetchHTML("https://example.com"),
    /Failed to fetch HTML: 503/
  );
});

test("throws when content-type is not html", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => '{"ok": true}',
  });

  await assert.rejects(
    () => fetchHTML("https://example.com"),
    /Invalid content-type/
  );
});

test("limits returned html size to 2,000,000 characters", async () => {
  const oversized = "a".repeat(2_500_000);
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => oversized,
  });

  const html = await fetchHTML("https://example.com");
  assert.equal(html.length, 2_000_000);
});
