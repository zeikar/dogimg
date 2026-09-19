import test from "node:test";
import assert from "node:assert/strict";
import { fetchHTML } from "../src/lib/fetch.js";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("returns response html when status and content-type are valid", async () => {
  let fetchInit;

  globalThis.fetch = async (_url, init) => {
    fetchInit = init;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
      text: async () => "<html><body>Hello</body></html>",
    };
  };

  const html = await fetchHTML("https://example.com");
  assert.equal(html, "<html><body>Hello</body></html>");
  assert.equal(fetchInit.headers.get("Accept-Language"), "en-US,en;q=0.9");
  assert.match(fetchInit.headers.get("User-Agent"), /DOGimgBot\/1\.0/);
});

test("retries without user-agent when runtime blocks setting it", async () => {
  const calls = [];

  globalThis.fetch = async (_url, init) => {
    calls.push(init);
    if (calls.length === 1) {
      throw new TypeError('Refused to set unsafe header "User-Agent"');
    }

    return {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
      text: async () => "<html><body>Hello</body></html>",
    };
  };

  const html = await fetchHTML("https://example.com");
  assert.equal(html, "<html><body>Hello</body></html>");
  assert.equal(calls.length, 2);
  assert.match(calls[0].headers.get("User-Agent"), /DOGimgBot\/1\.0/);
  assert.equal(calls[1].headers.get("User-Agent"), null);
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

test("rejects content when redirects land on a private address", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    // Where the request ended up after following redirects.
    url: "http://169.254.169.254/latest/meta-data/",
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => "<html><body>instance metadata</body></html>",
  });

  await assert.rejects(
    () => fetchHTML("https://totally-public.example"),
    /private or local address/
  );
});

test("accepts content when redirects land on another public address", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    url: "https://www.example.com/landing",
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => "<html><body>Hello</body></html>",
  });

  const html = await fetchHTML("https://example.com");
  assert.equal(html, "<html><body>Hello</body></html>");
});

test("retries for other header restriction wordings", async () => {
  for (const message of [
    "Refused to set unsafe header",
    "immutable headers cannot be modified",
    "forbidden header name",
  ]) {
    let calls = 0;
    globalThis.fetch = async (_url, init) => {
      calls += 1;
      if (calls === 1) {
        throw new TypeError(message);
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        text: async () => "<html></html>",
      };
    };

    await fetchHTML("https://example.com");
    assert.equal(calls, 2, `expected a retry for: ${message}`);
  }
});

test("does not retry an ordinary network failure", async () => {
  // fetch reports transport errors as TypeError as well, and the message can
  // mention "forbidden" without a header being involved. Resending would just
  // double the request.
  for (const message of [
    "fetch failed",
    "request to https://example.com failed, reason: forbidden by proxy",
  ]) {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      throw new TypeError(message);
    };

    await assert.rejects(() => fetchHTML("https://example.com"));
    assert.equal(calls, 1, `expected no retry for: ${message}`);
  }
});
