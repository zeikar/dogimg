import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../cli/run.js";
import { FALLBACK_HEADER } from "../src/lib/og-url.ts";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
const originalFetch = globalThis.fetch;
let dir;

test.beforeEach(async (t) => {
  dir = await mkdtemp(join(tmpdir(), "dogimg-cli-"));
  t.mock.method(console, "log", () => {});
  t.mock.method(console, "error", () => {});
});

test.afterEach(async () => {
  globalThis.fetch = originalFetch;
  await rm(dir, { recursive: true, force: true });
});

const printed = (method) =>
  method.mock.calls.map((call) => call.arguments.join(" ")).join("\n");

const exists = (path) => stat(path).then(() => true, () => false);

test("saves the card for the url, passing the url through intact", async () => {
  const target = "https://blog.example.com/post?id=42&lang=ko";
  const output = join(dir, "card.png");
  let requested;
  globalThis.fetch = async (url) => {
    requested = new URL(url);
    return new Response(PNG_BYTES, { headers: { "content-type": "image/png" } });
  };

  const code = await run([target, "-o", output]);

  assert.equal(code, 0);
  assert.equal(requested.origin + requested.pathname, "https://dogimg.vercel.app/api/og");
  assert.equal(requested.searchParams.get("url"), target);
  assert.deepEqual([...requested.searchParams.keys()], ["url"]);
  assert.deepEqual(new Uint8Array(await readFile(output)), PNG_BYTES);
});

test("saves to og.png in the working directory by default", async (t) => {
  const cwd = process.cwd();
  process.chdir(dir);
  t.after(() => process.chdir(cwd));
  globalThis.fetch = async () => new Response(PNG_BYTES);

  assert.equal(await run(["https://example.com"]), 0);
  assert.equal(await exists(join(dir, "og.png")), true);
});

// The header name is imported from the API's own module, so renaming it there
// fails this test instead of silently turning off the warning.
test("keeps a fallback card but warns and exits non-zero", async () => {
  const output = join(dir, "og.png");
  globalThis.fetch = async () =>
    new Response(PNG_BYTES, { headers: { [FALLBACK_HEADER]: "1" } });

  const code = await run(["https://unreachable.example", "-o", output]);

  assert.equal(code, 1);
  assert.equal(await exists(output), true);
  assert.match(printed(console.error), /fallback/);
});

test("reports the API's error instead of saving it as the image", async () => {
  const output = join(dir, "og.png");
  globalThis.fetch = async () =>
    new Response("Refusing to fetch a private or local address: localhost", {
      status: 400,
    });

  const code = await run(["http://localhost:3000", "-o", output]);

  assert.equal(code, 1);
  assert.equal(await exists(output), false);
  assert.match(printed(console.error), /Refusing to fetch a private or local address/);
});

test("reports a failed request", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed", { cause: new Error("getaddrinfo ENOTFOUND") });
  };

  const code = await run(["https://example.com", "-o", join(dir, "og.png")]);

  assert.equal(code, 1);
  assert.match(printed(console.error), /ENOTFOUND/);
});

// Node reports a refused connection to every address as an AggregateError
// whose message is empty; the reason is only in its code.
test("reports a failed request whose cause has no message", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed", {
      cause: Object.assign(new AggregateError([], ""), { code: "ECONNREFUSED" }),
    });
  };

  const code = await run(["https://example.com", "-o", join(dir, "og.png")]);

  assert.equal(code, 1);
  assert.match(printed(console.error), /ECONNREFUSED/);
});

test("reports an output path it can't write", async () => {
  globalThis.fetch = async () => new Response(PNG_BYTES);

  const code = await run(["https://example.com", "-o", join(dir, "missing", "og.png")]);

  assert.equal(code, 1);
  assert.match(printed(console.error), /missing/);
});

test("prints usage without a request when the url is missing or an option is unknown", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response(PNG_BYTES);
  };

  assert.equal(await run([]), 1);
  // `npx dogimg "$URL"` with URL unset: the API would draw its default page.
  assert.equal(await run([""]), 1);
  assert.equal(await run(["   "]), 1);
  assert.equal(await run(["https://example.com", "--nope"]), 1);
  assert.equal(await run(["https://a.example", "https://b.example"]), 1);
  assert.equal(await run(["--help"]), 0);
  assert.equal(called, false);
  assert.match(printed(console.log), /Usage: dogimg <url>/);
});
