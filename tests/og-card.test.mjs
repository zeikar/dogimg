import test from "node:test";
import assert from "node:assert/strict";
import { getAccentGradientColors, shortenString } from "../src/lib/og-card.ts";

test("reads rgb() the same way it reads the equivalent hex", () => {
  assert.deepEqual(
    getAccentGradientColors("rgb(255, 0, 0)"),
    getAccentGradientColors("#ff0000")
  );
  // Space separated percentages are the modern CSS syntax.
  assert.deepEqual(
    getAccentGradientColors("rgb(100% 0% 0%)"),
    getAccentGradientColors("#ff0000")
  );
});

test("ignores the alpha channel of rgba()", () => {
  assert.deepEqual(
    getAccentGradientColors("rgba(0, 128, 255, 0.5)"),
    getAccentGradientColors("#0080ff")
  );
});

test("falls back to the accent color for values it cannot parse", () => {
  const fallback = getAccentGradientColors("");
  for (const value of ["garbage", "rgb(300, 0, 0)", "rgb(1, 2)", "#12345"]) {
    assert.deepEqual(getAccentGradientColors(value), fallback);
  }
});

test("collapses whitespace and leaves short strings untouched", () => {
  assert.equal(shortenString("  spaced   out   text ", 40), "spaced out text");
  assert.equal(shortenString("", 40), "");
});

test("cuts on a word boundary only when the boundary is late enough", () => {
  // lastSpace at 18 of 20 clears the 0.6 threshold, so the word survives.
  assert.equal(
    shortenString("one two three four five", 20),
    "one two three four..."
  );
  // lastSpace at 7 of 12 does not, so it cuts mid word rather than losing half.
  assert.equal(shortenString("one two three four five", 12), "one two thre...");
});

test("resolves CSS named colors, case and padding insensitively", () => {
  assert.deepEqual(
    getAccentGradientColors("red"),
    getAccentGradientColors("#ff0000")
  );
  assert.deepEqual(
    getAccentGradientColors("  ReBeccaPurple "),
    getAccentGradientColors("#663399")
  );
  // Synonyms must not drift apart.
  assert.deepEqual(getAccentGradientColors("grey"), getAccentGradientColors("gray"));
  assert.deepEqual(getAccentGradientColors("aqua"), getAccentGradientColors("cyan"));
});

test("still rejects words that are not colors", () => {
  const fallback = getAccentGradientColors("");
  for (const value of ["not-a-color", "bluish", "transparent"]) {
    assert.deepEqual(getAccentGradientColors(value), fallback);
  }
});
