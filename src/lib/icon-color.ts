import { Unzlib } from "fflate";
import { getChroma, isChromatic, parseColor, rgbToHsl } from "./color.js";

type Rgb = { r: number; g: number; b: number };

// A favicon is untrusted input, and a PNG's header is a promise about how much
// memory decoding will take. Anything larger than this is not decoded at all.
const MAX_ICON_DIMENSION = 1024;
// Plenty to find one dominant color, and it bounds the work on a large icon.
const MAX_SAMPLES = 4096;
// 30-degree bins, shifted so red (which wraps around 0) lands in a single one.
const HUE_BINS = 12;
// Below this share of an icon's pixels, the color is an accent on a
// black-and-white icon, not its identity.
const MIN_CHROMATIC_SHARE = 0.05;
// Input is fed to the inflater in slices so it can be abandoned part-way: at
// deflate's ~1000:1 ceiling, one slice can expand to about 4MB at most.
const INFLATE_SLICE_BYTES = 4096;
const NEEDED_CHUNKS = new Set(["IHDR", "PLTE", "tRNS", "IDAT"]);

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const CHANNELS_BY_COLOR_TYPE: Record<number, number> = { 2: 3, 3: 1, 6: 4 };

// The most prominent non-gray color among the samples. Area decides: a sample
// votes for its hue with only the square root of its chroma, so vividness tips
// close calls but a small bright detail can't outvote a large dark field.
function pickDominantColor(samples: Rgb[], minChromaticShare: number): Rgb | null {
  const bins = Array.from({ length: HUE_BINS }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
  let chromatic = 0;

  for (const sample of samples) {
    if (!isChromatic(sample)) {
      continue;
    }

    chromatic++;
    const weight = Math.sqrt(getChroma(sample));
    const bin = bins[Math.floor(((rgbToHsl(sample).h + 15) % 360) / 30)];
    bin.weight += weight;
    bin.r += sample.r * weight;
    bin.g += sample.g * weight;
    bin.b += sample.b * weight;
  }

  if (chromatic === 0 || chromatic / samples.length < minChromaticShare) {
    return null;
  }

  // Judged as adjacent pairs: one orange can straddle a bin edge, and scored
  // bin by bin its two halves would each lose to a smaller but undivided blue.
  let best = { weight: 0, r: 0, g: 0, b: 0 };
  bins.forEach((bin, index) => {
    const next = bins[(index + 1) % HUE_BINS];
    if (bin.weight + next.weight > best.weight) {
      best = {
        weight: bin.weight + next.weight,
        r: bin.r + next.r,
        g: bin.g + next.g,
        b: bin.b + next.b,
      };
    }
  });

  return {
    r: Math.round(best.r / best.weight),
    g: Math.round(best.g / best.weight),
    b: Math.round(best.b / best.weight),
  };
}

function readChunks(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks = new Map<string, Uint8Array[]>();
  let offset = PNG_SIGNATURE.length;

  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const end = offset + 8 + length;
    if (end > bytes.length) {
      return null;
    }

    // Appending in place, and only what is used: rebuilding the list per chunk
    // made a file of 170,000 empty chunks cost half a minute.
    if (NEEDED_CHUNKS.has(type)) {
      const data = bytes.subarray(offset + 8, end);
      chunks.get(type)?.push(data) ?? chunks.set(type, [data]);
    }
    if (type === "IEND") {
      break;
    }
    offset = end + 4; // skip the CRC
  }

  return chunks;
}

function concat(parts: Uint8Array[]) {
  const merged = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

// Pure JS because the Edge Runtime has no DecompressionStream. The header has
// already said how many bytes to expect, so the stream is dropped the moment it
// produces more: a 2MB bomb that would inflate to 2GB costs milliseconds.
// (fflate's one-shot `out` option bounds the memory but still inflates it all.)
function inflate(data: Uint8Array, expectedLength: number) {
  const output = new Uint8Array(expectedLength);
  let length = 0;
  let overflowed = false;

  const stream = new Unzlib((chunk) => {
    if (length + chunk.length > expectedLength) {
      overflowed = true;
      return;
    }
    output.set(chunk, length);
    length += chunk.length;
  });

  for (let offset = 0; offset < data.length && !overflowed; offset += INFLATE_SLICE_BYTES) {
    const end = offset + INFLATE_SLICE_BYTES;
    stream.push(data.subarray(offset, end), end >= data.length);
  }

  return !overflowed && length === expectedLength ? output : null;
}

// Reverses the per-row prediction filters in place (PNG spec, section 9).
function unfilter(data: Uint8Array, height: number, rowBytes: number, bytesPerPixel: number) {
  const stride = rowBytes + 1;

  for (let y = 0; y < height; y++) {
    const filter = data[y * stride];
    const row = y * stride + 1;
    const above = row - stride;

    for (let x = 0; x < rowBytes; x++) {
      const left = x >= bytesPerPixel ? data[row + x - bytesPerPixel] : 0;
      const up = y > 0 ? data[above + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? data[above + x - bytesPerPixel] : 0;

      let prediction = 0;
      if (filter === 1) {
        prediction = left;
      } else if (filter === 2) {
        prediction = up;
      } else if (filter === 3) {
        prediction = (left + up) >> 1;
      } else if (filter === 4) {
        const estimate = left + up - upLeft;
        const distLeft = Math.abs(estimate - left);
        const distUp = Math.abs(estimate - up);
        const distUpLeft = Math.abs(estimate - upLeft);
        prediction =
          distLeft <= distUp && distLeft <= distUpLeft
            ? left
            : distUp <= distUpLeft
              ? up
              : upLeft;
      } else if (filter !== 0) {
        return false;
      }

      data[row + x] = (data[row + x] + prediction) & 0xff;
    }
  }

  return true;
}

// The opaque pixels of a PNG, thinned to at most MAX_SAMPLES. Exported for the
// tests, which check decoding pixel by pixel.
export function samplePng(bytes: Uint8Array): Rgb[] | null {
  if (PNG_SIGNATURE.some((byte, index) => bytes[index] !== byte)) {
    return null;
  }

  const chunks = readChunks(bytes);
  const header = chunks?.get("IHDR")?.[0];
  const idat = chunks?.get("IDAT");
  if (!chunks || !header || header.length < 13 || !idat) {
    return null;
  }

  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  const width = view.getUint32(0);
  const height = view.getUint32(4);
  const [bitDepth, colorType, , , interlace] = header.subarray(8, 13);
  const channels = CHANNELS_BY_COLOR_TYPE[colorType];

  // Grayscale has no color to find. Interlaced and 16-bit icons are rare
  // enough that a second code path is not worth it: they fall through to the
  // hostname hue like any icon without a usable color.
  if (
    !channels ||
    interlace !== 0 ||
    width === 0 ||
    height === 0 ||
    width > MAX_ICON_DIMENSION ||
    height > MAX_ICON_DIMENSION ||
    (colorType === 3 ? ![1, 2, 4, 8].includes(bitDepth) : bitDepth !== 8)
  ) {
    return null;
  }

  const palette = chunks.get("PLTE")?.[0];
  // For a palette, one alpha per entry. For RGB, a single color (as three
  // 16-bit values) that stands for "transparent" — often a loud magenta.
  const transparency = chunks.get("tRNS")?.[0];
  const keyedOut =
    colorType === 2 && transparency?.length === 6
      ? [transparency[1], transparency[3], transparency[5]]
      : null;
  if (colorType === 3 && !palette) {
    return null;
  }

  const rowBytes = Math.ceil((width * channels * bitDepth) / 8);
  const data = inflate(concat(idat), height * (rowBytes + 1));
  if (!data || !unfilter(data, height, rowBytes, Math.max(1, (channels * bitDepth) >> 3))) {
    return null;
  }

  const step = Math.max(1, Math.ceil(Math.sqrt((width * height) / MAX_SAMPLES)));
  const samples: Rgb[] = [];

  // From the middle of each step-sized cell rather than its corner.
  for (let y = step >> 1; y < height; y += step) {
    const row = y * (rowBytes + 1) + 1;

    for (let x = step >> 1; x < width; x += step) {
      if (colorType === 3) {
        const bit = x * bitDepth;
        const index =
          (data[row + (bit >> 3)] >> (8 - bitDepth - (bit & 7))) & ((1 << bitDepth) - 1);
        // tRNS may cover only the first few entries; the rest are opaque.
        if ((transparency?.[index] ?? 255) < 128 || index * 3 + 2 >= palette!.length) {
          continue;
        }
        samples.push({
          r: palette![index * 3],
          g: palette![index * 3 + 1],
          b: palette![index * 3 + 2],
        });
        continue;
      }

      const pixel = row + x * channels;
      if (
        (channels === 4 && data[pixel + 3] < 128) ||
        keyedOut?.every((value, channel) => data[pixel + channel] === value)
      ) {
        continue;
      }
      samples.push({ r: data[pixel], g: data[pixel + 1], b: data[pixel + 2] });
    }
  }

  return samples;
}

// An SVG is not rendered here, so area is unknown; how often a color is used
// stands in for it. "none", currentColor and url(#gradient) parse to nothing.
function sampleSvg(bytes: Uint8Array): Rgb[] {
  const declarations = new TextDecoder()
    .decode(bytes)
    .matchAll(/(?:fill|stroke|stop-color|color)\s*[=:]\s*["']?\s*([^"';<>{}!]+)/gi);
  const samples: Rgb[] = [];

  // Consumed lazily and capped: a hostile 2MB SVG holds 300,000 declarations.
  for (const [, value] of declarations) {
    const color = parseColor(value);
    if (color && samples.push(color) >= MAX_SAMPLES) {
      break;
    }
  }

  return samples;
}

// The color a favicon is "about", or null when it has none worth using or is
// in a format not read here (JPEG and GIF favicons are vanishingly rare).
export function getDominantIconColor(bytes: Uint8Array, mimeType: string) {
  try {
    if (mimeType === "image/png" || mimeType === "image/apng") {
      const samples = samplePng(bytes);
      return samples && pickDominantColor(samples, MIN_CHROMATIC_SHARE);
    }
    if (mimeType === "image/svg+xml") {
      // No share threshold: declarations are not area, and one brand fill
      // among twenty white details is still the icon's color.
      return pickDominantColor(sampleSvg(bytes), 0);
    }
    return null;
  } catch (e) {
    // fflate throws on a corrupt deflate stream. The card only loses a nicety.
    console.warn("[og] could not read the favicon's colors:", e);
    return null;
  }
}
