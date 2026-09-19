import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { constants, crc32, deflateRawSync, deflateSync } from "node:zlib";
import { getDominantIconColor, samplePng } from "../src/lib/icon-color.ts";

// The fixtures were drawn with ImageMagick, so they check the decoder against
// an independent encoder: palettes, packed bits, alpha. ImageMagick barely uses
// the row filters on images this simple, so those get their own test below.
const fixture = async (name) =>
  new Uint8Array(await readFile(new URL(`./fixtures/${name}`, import.meta.url)));

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

// An 8-bit PNG (RGBA unless told otherwise) whose header and pixel data can
// disagree on purpose. `idat` overrides the compressed stream entirely.
function craftPng({ width, height, raw, idat, colorType = 6, extraChunks = [] }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, colorType, 0, 0, 0], 8);

  return new Uint8Array(
    Buffer.concat([
      Buffer.from(PNG_SIGNATURE),
      chunk("IHDR", header),
      ...extraChunks,
      chunk("IDAT", idat ?? deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ])
  );
}

// The forward half of PNG's row filters, so a test can force each one.
function filterRows(pixels, width, height, channels, filterFor) {
  const rowBytes = width * channels;
  const rows = [];

  for (let y = 0; y < height; y++) {
    const filter = filterFor(y);
    const row = Buffer.alloc(rowBytes + 1);
    row[0] = filter;

    for (let x = 0; x < rowBytes; x++) {
      const at = (dy, dx) =>
        y + dy < 0 || x + dx < 0 ? 0 : pixels[(y + dy) * rowBytes + x + dx];
      const left = at(0, -channels);
      const up = at(-1, 0);
      const upLeft = at(-1, -channels);
      const estimate = left + up - upLeft;
      const [dl, du, dul] = [left, up, upLeft].map((v) => Math.abs(estimate - v));
      const paeth = dl <= du && dl <= dul ? left : du <= dul ? up : upLeft;
      const prediction = [0, left, up, (left + up) >> 1, paeth][filter];
      row[x + 1] = (pixels[y * rowBytes + x] - prediction) & 0xff;
    }
    rows.push(row);
  }

  return Buffer.concat(rows);
}

function solidRows(width, height, [r, g, b, a]) {
  const row = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(Array.from({ length: width }, () => [r, g, b, a]).flat()),
  ]);
  return Buffer.concat(Array.from({ length: height }, () => row));
}

const dominantChannel = ({ r, g, b }) =>
  r >= g && r >= b ? "r" : g >= b ? "g" : "b";

test("finds the brand color of an RGBA icon, ignoring white and transparency", async () => {
  const color = getDominantIconColor(
    await fixture("icon-green.png"),
    "image/png"
  );
  // Drawn in #12b886; edge anti-aliasing may nudge the average slightly.
  assert.ok(Math.abs(color.r - 0x12) <= 12, `r=${color.r}`);
  assert.ok(Math.abs(color.g - 0xb8) <= 12, `g=${color.g}`);
  assert.ok(Math.abs(color.b - 0x86) <= 12, `b=${color.b}`);
});

test("reads palette icons, including ones packed below a byte per pixel", async () => {
  const blue = getDominantIconColor(
    await fixture("icon-blue-palette.png"),
    "image/png"
  );
  assert.equal(dominantChannel(blue), "b");

  const orange = getDominantIconColor(
    await fixture("icon-orange-2bit.png"),
    "image/png"
  );
  assert.equal(dominantChannel(orange), "r");
  assert.ok(orange.g > orange.b, "orange, not red or magenta");
});

test("picks the color that covers the most area, not the first one it meets", async () => {
  const color = getDominantIconColor(
    await fixture("icon-red-with-blue-dot.png"),
    "image/png"
  );
  assert.equal(dominantChannel(color), "r");
});

test("returns nothing for an icon with no color in it", async () => {
  assert.equal(
    getDominantIconColor(await fixture("icon-mono.png"), "image/png"),
    null
  );
});

test("gives up on PNGs it does not decode rather than guessing", async () => {
  // Adam7 interlacing is not worth a second code path for a favicon.
  assert.equal(
    getDominantIconColor(await fixture("icon-interlaced.png"), "image/png"),
    null
  );
  for (const mimeType of ["image/jpeg", "image/gif", ""]) {
    assert.equal(
      getDominantIconColor(await fixture("icon-green.png"), mimeType),
      null
    );
  }
});

test("refuses oversized dimensions before inflating anything", async () => {
  // The header alone promises ~100MB of pixels; the data never backs it up.
  const png = craftPng({ width: 5000, height: 5000, raw: Buffer.alloc(16) });
  assert.equal(getDominantIconColor(png, "image/png"), null);
});

test("rejects pixel data that inflates past what the header declared", async () => {
  // Declares 4x4 but carries 512x512 worth of rows: a small decompression bomb.
  const png = craftPng({
    width: 4,
    height: 4,
    raw: solidRows(512, 512, [255, 0, 0, 255]),
  });
  assert.equal(getDominantIconColor(png, "image/png"), null);
});

test("survives truncated and corrupt files", async () => {
  const valid = craftPng({
    width: 8,
    height: 8,
    raw: solidRows(8, 8, [0, 120, 255, 255]),
  });
  assert.equal(dominantChannel(getDominantIconColor(valid, "image/png")), "b");

  assert.equal(getDominantIconColor(valid.subarray(0, 40), "image/png"), null);
  assert.equal(getDominantIconColor(new Uint8Array(0), "image/png"), null);

  const corrupt = valid.slice();
  // Flip bytes inside the deflate stream.
  for (let i = 45; i < 55; i++) {
    corrupt[i] ^= 0xff;
  }
  assert.equal(getDominantIconColor(corrupt, "image/png"), null);

  // Too few pixel bytes for the declared size.
  const short = craftPng({ width: 8, height: 8, raw: solidRows(8, 3, [255, 0, 0, 255]) });
  assert.equal(getDominantIconColor(short, "image/png"), null);
});

test("reads fills out of an SVG icon", async () => {
  const svg = (body) =>
    new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`);

  const green = getDominantIconColor(
    svg('<rect fill="#03c75a" width="10" height="10"/><path fill="#fff" d="M0 0"/>'),
    "image/svg+xml"
  );
  assert.deepEqual(green, { r: 0x03, g: 0xc7, b: 0x5a });

  const styled = getDominantIconColor(
    svg('<circle style="fill: rgb(225, 29, 72); stroke: none" r="5"/>'),
    "image/svg+xml"
  );
  assert.deepEqual(styled, { r: 225, g: 29, b: 72 });

  // currentColor, none and gradient references carry no color of their own.
  assert.equal(
    getDominantIconColor(
      svg('<path fill="currentColor"/><path fill="none" stroke="url(#g)"/><path fill="#000"/>'),
      "image/svg+xml"
    ),
    null
  );
});

test("undoes every row filter exactly", () => {
  const [width, height, channels] = [13, 11, 4];
  // Deterministic noise with frequent equal neighbors, so Paeth's tie-breaking
  // order matters, and opaque alpha so every pixel is sampled.
  let seed = 7;
  const pixels = Uint8Array.from({ length: width * height * channels }, (_, i) => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return i % channels === 3 ? 255 : (seed >>> 16) % 4 === 0 ? 0 : (seed >>> 16) & 0xff;
  });
  const expected = [];
  for (let i = 0; i < pixels.length; i += channels) {
    expected.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
  }

  for (const filterFor of [() => 0, () => 1, () => 2, () => 3, () => 4, (y) => y % 5]) {
    const png = craftPng({
      width,
      height,
      raw: filterRows(pixels, width, height, channels, filterFor),
    });
    assert.deepEqual(samplePng(png), expected);
  }
});

test("skips the keyed-out color of an RGB icon with a transparency key", () => {
  // Old-style transparency: one RGB value (here magenta) means "see-through".
  const [width, height] = [10, 10];
  const pixels = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    pixels.set(i < 80 ? [255, 0, 255] : [20, 160, 60], i * 3);
  }
  const key = Buffer.from([0, 255, 0, 0, 0, 255]); // 16-bit R, G, B
  const png = craftPng({
    width,
    height,
    colorType: 2,
    raw: filterRows(pixels, width, height, 3, () => 0),
    extraChunks: [chunk("tRNS", key)],
  });
  assert.equal(dominantChannel(getDominantIconColor(png, "image/png")), "g");
});

test("joins a color that straddles two hue bins instead of losing to a smaller one", () => {
  // 60% orange, split across the 45-degree bin edge, against 40% blue.
  const [width, height] = [10, 10];
  const pixels = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const color = i < 30 ? [255, 187, 0] : i < 60 ? [255, 196, 0] : [0, 90, 255];
    pixels.set([...color, 255], i * 4);
  }
  const png = craftPng({ width, height, raw: filterRows(pixels, width, height, 4, () => 0) });
  assert.equal(dominantChannel(getDominantIconColor(png, "image/png")), "r");
});

test("lets area decide between a large dark field and a small vivid detail", () => {
  const [width, height] = [10, 10];
  const pixels = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    pixels.set([...(i < 80 ? [0x0b, 0x3d, 0x2e] : [0xff, 0xd4, 0x00]), 255], i * 4);
  }
  const png = craftPng({ width, height, raw: filterRows(pixels, width, height, 4, () => 0) });
  assert.equal(dominantChannel(getDominantIconColor(png, "image/png")), "g");
});

// Everything below must stay fast: the input is attacker-controlled, the work
// is synchronous, and no timeout can interrupt it.
const elapsed = (run) => {
  const start = performance.now();
  run();
  return performance.now() - start;
};

test("reads a file made of 170,000 empty chunks in linear time", () => {
  const empty = chunk("juNk", Buffer.alloc(0));
  const png = new Uint8Array(
    Buffer.concat([Buffer.from(PNG_SIGNATURE), ...Array.from({ length: 170_000 }, () => empty)])
  );
  // Quadratic chunk bookkeeping took 28s on this input.
  assert.ok(elapsed(() => assert.equal(getDominantIconColor(png, "image/png"), null)) < 1000);
});

test("abandons a decompression bomb as soon as it outgrows the header", () => {
  // ~1MB of zeros as one sync-flushed (so byte-aligned, non-final) deflate
  // segment; repeated, 2MB of input inflates to about 2GB.
  const segment = deflateRawSync(Buffer.alloc(1 << 20), {
    finishFlush: constants.Z_SYNC_FLUSH,
  });
  const repeats = Math.floor((2 * 1024 * 1024) / segment.length);
  const idat = Buffer.concat([
    Buffer.from([0x78, 0x9c]),
    ...Array.from({ length: repeats }, () => segment),
  ]);

  for (const size of [1, 1024]) {
    const png = craftPng({ width: size, height: size, idat });
    // Bounded, this is about a millisecond. Left to run it is a second of CPU
    // and 3.6GB of memory, so the bar sits far from both.
    assert.ok(elapsed(() => assert.equal(getDominantIconColor(png, "image/png"), null)) < 100);
  }
});

test("stops collecting SVG colors once it has enough", () => {
  const svg = new TextEncoder().encode(`<svg>${"<p style='fill:a;'/>".repeat(100_000)}</svg>`);
  const before = process.memoryUsage().heapUsed;
  assert.equal(getDominantIconColor(svg, "image/svg+xml"), null);
  assert.ok(process.memoryUsage().heapUsed - before < 20 * 1024 * 1024);
});

test("reads colors from SVG stylesheets and ignores how often white is declared", () => {
  const svg = (body) =>
    new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`);

  assert.deepEqual(
    getDominantIconColor(svg("<style>.a{fill:#03c75a}.b{fill:#fff !important}</style>"), "image/svg+xml"),
    { r: 0x03, g: 0xc7, b: 0x5a }
  );
  // Declarations are not area: one brand fill among many white details is
  // still the icon's color.
  assert.deepEqual(
    getDominantIconColor(
      svg(`<rect fill="#e11d48"/>${'<path fill="#fff"/>'.repeat(25)}`),
      "image/svg+xml"
    ),
    { r: 0xe1, g: 0x1d, b: 0x48 }
  );
});
