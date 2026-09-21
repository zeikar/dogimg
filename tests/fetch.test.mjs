import test from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns";
import http from "node:http";
import undici from "undici";
import {
  fetchHTML,
  fetchPublicUrl,
  lookupPublicAddress,
  publicOnlyDispatcher,
} from "../src/lib/fetch.js";
import { InvalidTargetUrlError } from "../src/lib/target-url.js";

const originalFetch = undici.fetch;

test.afterEach(() => {
  undici.fetch = originalFetch;
});

test("returns response html when status and content-type are valid", async () => {
  let fetchInit;

  undici.fetch = async (_url, init) => {
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

test("throws when response status is not ok", async () => {
  undici.fetch = async () => ({
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
  undici.fetch = async () => ({
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
  undici.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => oversized,
  });

  const html = await fetchHTML("https://example.com");
  assert.equal(html.length, 2_000_000);
});

test("never sends a request to a private address", async () => {
  // A page controls its own <link rel="icon">, so these reach the fetcher as
  // favicon URLs. Rejecting the response afterwards would be too late: the
  // request itself is what reaches the internal service.
  let requests = 0;
  undici.fetch = async () => {
    requests++;
    return { ok: true, status: 200, url: "", headers: new Headers() };
  };

  for (const url of [
    "http://169.254.169.254/latest/meta-data/",
    "http://127.0.0.1:8080/icon.png",
    "http://10.0.0.5/favicon.png",
    "http://localhost/favicon.svg",
    "http://printer.internal/logo.png",
    "file:///etc/passwd",
    "ftp://example.com/icon.png",
  ]) {
    await assert.rejects(fetchPublicUrl(url), /private or local|not an http/);
  }
  assert.equal(requests, 0);
});

test("passes a public url through with the caller's init", async () => {
  let seen;
  undici.fetch = async (url, init) => {
    seen = { url, init };
    return { ok: true, status: 200, url, headers: new Headers() };
  };

  const response = await fetchPublicUrl("https://example.com/favicon.png", {
    headers: { Accept: "image/*" },
  });
  assert.equal(response.ok, true);
  assert.equal(seen.url, "https://example.com/favicon.png");
  assert.equal(seen.init.headers.get("Accept"), "image/*");
  assert.equal(seen.init.dispatcher, publicOnlyDispatcher);
});

// The tests below use undici's real fetch against a server on loopback, which
// stands in for an internal service. A hostname is the one thing the url check
// can't judge, so these reach the connection, where the guard has to hold.
async function startInternalServer(t) {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(req.url);
    res.writeHead(200, { "content-type": "text/html" });
    res.end("<title>internal admin</title>");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  return { hits, port: server.address().port };
}

function resolveTo(t, ...addresses) {
  const answers = addresses.map((address) => ({
    address,
    family: address.includes(":") ? 6 : 4,
  }));
  t.mock.method(dns, "lookup", (_hostname, options, callback) =>
    options.all
      ? callback(null, answers)
      : callback(null, answers[0].address, answers[0].family)
  );
}

test("refuses to connect to a hostname that resolves to a private address", async (t) => {
  const { hits, port } = await startInternalServer(t);
  resolveTo(t, "127.0.0.1");

  const error = await fetchPublicUrl(`http://intranet.example:${port}/`).catch((e) => e);

  assert.ok(error.cause instanceof InvalidTargetUrlError, String(error.cause ?? error));
  assert.deepEqual(hits, []);
});

// A redirect names its next hop in a Location header, often as a bare IP,
// and Node connects to an IP without looking it up.
test("refuses to connect to a private ip even without a lookup", async (t) => {
  const { hits, port } = await startInternalServer(t);

  const error = await undici
    .fetch(`http://127.0.0.1:${port}/`, { dispatcher: publicOnlyDispatcher })
    .catch((e) => e);

  assert.ok(error.cause instanceof InvalidTargetUrlError, String(error.cause ?? error));
  assert.deepEqual(hits, []);
});

const lookup = (hostname, options) =>
  new Promise((resolve, reject) =>
    lookupPublicAddress(hostname, options, (error, ...result) =>
      error ? reject(error) : resolve(result)
    )
  );

// Node asks for every address when it races IPv4 against IPv6, and for one
// otherwise; the answer has to come back in the shape it asked for.
test("passes public answers on in the shape the connection asked for", async (t) => {
  resolveTo(t, "203.0.113.10", "2001:db8::10");

  assert.deepEqual(await lookup("public.example", { all: true }), [
    [
      { address: "203.0.113.10", family: 4 },
      { address: "2001:db8::10", family: 6 },
    ],
  ]);
  assert.deepEqual(await lookup("public.example", {}), ["203.0.113.10", 4]);
});

// The connection may go to any of the answers, so one private answer among
// public ones is as good as a private hostname.
test("refuses a hostname when any of its answers is private", async (t) => {
  for (const answers of [
    ["203.0.113.10", "127.0.0.1"],
    ["127.0.0.1", "203.0.113.10"],
    ["2001:db8::10", "::1"],
  ]) {
    t.mock.restoreAll();
    resolveTo(t, ...answers);

    for (const options of [{ all: true }, {}]) {
      await assert.rejects(
        lookup("mixed.example", options),
        InvalidTargetUrlError,
        `${answers} with ${JSON.stringify(options)}`
      );
    }
  }
});
