import test from "node:test";
import assert from "node:assert/strict";
import {
  getCardPalette,
  getTitleFontSize,
  shortenString,
} from "../src/lib/og-card.ts";

// Same seed throughout, so any difference comes from the color argument.
const paletteFor = (color) => getCardPalette(color, "example.com");

test("reads rgb() the same way it reads the equivalent hex", () => {
  assert.deepEqual(
    paletteFor("rgb(255, 0, 0)"),
    paletteFor("#ff0000")
  );
  // Space separated percentages are the modern CSS syntax.
  assert.deepEqual(
    paletteFor("rgb(100% 0% 0%)"),
    paletteFor("#ff0000")
  );
});

test("ignores the alpha channel of rgba()", () => {
  assert.deepEqual(
    paletteFor("rgba(0, 128, 255, 0.5)"),
    paletteFor("#0080ff")
  );
});

test("falls back to the accent color for values it cannot parse", () => {
  const fallback = paletteFor("");
  for (const value of ["garbage", "rgb(300, 0, 0)", "rgb(1, 2)", "#12345"]) {
    assert.deepEqual(paletteFor(value), fallback);
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
    paletteFor("red"),
    paletteFor("#ff0000")
  );
  assert.deepEqual(
    paletteFor("  ReBeccaPurple "),
    paletteFor("#663399")
  );
  // Synonyms must not drift apart.
  assert.deepEqual(paletteFor("grey"), paletteFor("gray"));
  assert.deepEqual(paletteFor("aqua"), paletteFor("cyan"));
});

test("still rejects words that are not colors", () => {
  const fallback = paletteFor("");
  for (const value of ["not-a-color", "bluish", "transparent"]) {
    assert.deepEqual(paletteFor(value), fallback);
  }
});

test("keeps the hue of a usable theme-color", () => {
  // Pure blue is too dark to sit on white as is, so lightness moves — but the
  // accent must still be blue-dominant, not a hashed replacement.
  const [r, g, b] = getCardPalette("#0000ff", "example.com")
    .accent.match(/\d+/g)
    .map(Number);
  assert.ok(b > r && b > g);
});

test("treats black, white and gray theme-colors as no color at all", () => {
  const undeclared = getCardPalette("", "example.com");
  // #fffbeb is fully saturated in HSL terms and still reads as white.
  for (const value of ["#000000", "#ffffff", "#1e2327", "#bbbbbb", "#fffbeb"]) {
    assert.deepEqual(getCardPalette(value, "example.com"), undeclared);
  }
});

test("picks a stable accent per hostname when a page declares none", () => {
  assert.deepEqual(
    getCardPalette("", "github.com"),
    getCardPalette("", "github.com")
  );

  const accents = new Set(
    ["github.com", "naver.com", "stripe.com", "nextjs.org", "youtube.com"].map(
      (hostname) => getCardPalette("", hostname).accent
    )
  );
  assert.ok(accents.size > 1);
});

test("steps the title size down as the title gets longer", () => {
  assert.equal(getTitleFontSize("YouTube"), 88);
  assert.equal(getTitleFontSize("Next.js by Vercel - The React Framework"), 72);
  assert.equal(
    getTitleFontSize("GitHub · Change is constant. GitHub keeps you ahead."),
    60
  );
});

test("counts CJK characters double when sizing the title", () => {
  // 13 characters, but as wide as 26 Latin ones: too long for the top tier.
  assert.equal(getTitleFontSize("가나다라마바사아자차카타파"), 72);
});
