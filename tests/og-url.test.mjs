import test from "node:test";
import assert from "node:assert/strict";
import { getOgImagePath, getOgImageUrl } from "../src/lib/og-url.ts";

test("encodes the target url so query params survive the round trip", () => {
  const target = "https://blog.example.com/post?id=42&lang=ko";

  const parsed = new URL(getOgImageUrl(target));
  assert.equal(parsed.searchParams.get("url"), target);
  // The target's own params must not leak into DOGimg's query string.
  assert.deepEqual([...parsed.searchParams.keys()], ["url"]);
});

test("path and absolute url builders resolve to the same request", () => {
  const target = "https://blog.example.com/post?id=42&lang=ko";

  const fromPath = new URL(getOgImagePath(target), "https://dogimg.vercel.app");
  const fromAbsolute = new URL(getOgImageUrl(target));

  assert.equal(fromPath.toString(), fromAbsolute.toString());
});

test("encodes characters that would otherwise break the query string", () => {
  for (const target of [
    "https://example.com/a b",
    "https://example.com/?q=a#frag",
    "https://example.com/?a=1&b=2&c=3",
    "https://example.com/검색?q=한글",
  ]) {
    const parsed = new URL(getOgImageUrl(target));
    assert.equal(parsed.searchParams.get("url"), target);
  }
});
