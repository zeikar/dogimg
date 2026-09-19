import { fetchPublicUrl } from "@/lib/fetch";
import { InvalidTargetUrlError } from "@/lib/target-url";
import { isRenderableIconHref } from "@/lib/icon-href";
import { getDominantIconColor } from "@/lib/icon-color";

const NO_FAVICON = { src: "", color: null };

const FAVICON_TIMEOUT_MS = 5000;
// Favicons are small by nature; anything larger is either broken or hostile.
// The whole payload is held in memory as raw bytes and again as a base64 data
// URL, and reading its colors briefly adds the decoded pixels (capped there).
const MAX_FAVICON_BYTES = 2 * 1024 * 1024;

const SUPPORTED_FAVICON_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/apng",
]);

function getGoogleFaviconUrl(pageUrl: string) {
  try {
    const url = new URL(pageUrl);
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(
      url.origin
    )}`;
  } catch {
    return "";
  }
}

function resolveFaviconUrl(favicon: string, pageUrl: string) {
  return isRenderableIconHref(favicon) ? favicon : getGoogleFaviconUrl(pageUrl);
}

function bytesToBase64(bytes: Uint8Array) {
  // Chunked so we never spread more args than String.fromCharCode accepts.
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Stops reading as soon as the limit is passed, so a chunked response that
// never declares content-length can't stream unbounded data into memory.
async function readBodyWithLimit(response: Response, maxBytes: number) {
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    return buffer.byteLength > maxBytes ? null : new Uint8Array(buffer);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function detectFaviconMimeType(bytes: Uint8Array, contentType: string) {
  const headerMime = contentType.split(";")[0].trim().toLowerCase();
  if (SUPPORTED_FAVICON_MIME_TYPES.has(headerMime)) {
    return headerMime;
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }

  const head = new TextDecoder().decode(
    bytes.subarray(0, Math.min(bytes.length, 512))
  );
  if (/<svg[\s>]/i.test(head)) {
    return "image/svg+xml";
  }

  return "";
}

async function fetchFavicon(imageUrl: string) {
  if (!imageUrl) {
    return NO_FAVICON;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FAVICON_TIMEOUT_MS);

  try {
    const init = {
      headers: {
        Accept: "image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    };
    // The icon URL is lifted out of the fetched page, so it is exactly as
    // untrusted as the page URL: <link rel="icon" href="http://10.0.0.5/…">
    // must not be requested. An inline data: icon never touches the network.
    const response = imageUrl.startsWith("data:")
      ? await fetch(imageUrl, init)
      : await fetchPublicUrl(imageUrl, init);

    if (!response.ok) {
      return NO_FAVICON;
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("text/html")) {
      return NO_FAVICON;
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (declaredLength > MAX_FAVICON_BYTES) {
      return NO_FAVICON;
    }

    const bytes = await readBodyWithLimit(response, MAX_FAVICON_BYTES);
    if (!bytes) {
      return NO_FAVICON;
    }

    const mimeType = detectFaviconMimeType(bytes, contentType);
    if (!mimeType) {
      return NO_FAVICON;
    }

    return {
      src: `data:${mimeType};base64,${bytesToBase64(bytes)}`,
      color: getDominantIconColor(bytes, mimeType),
    };
  } catch (e) {
    // An unreachable icon is routine and stays quiet; a refused one is a page
    // pointing this service at a private address, which is worth a trace.
    if (e instanceof InvalidTargetUrlError) {
      console.warn(`[og] refused favicon url: ${e.message}`);
    }
    return NO_FAVICON;
  } finally {
    clearTimeout(timeout);
  }
}

// `src` is a data URL ready to embed, `color` the icon's dominant color for
// the card to match; either may be missing.
export async function resolveRenderableFavicon(favicon: string, pageUrl: string) {
  const candidate = resolveFaviconUrl(favicon, pageUrl);
  const resolvedCandidate = await fetchFavicon(candidate);
  if (resolvedCandidate.src) {
    return resolvedCandidate;
  }

  const fallback = getGoogleFaviconUrl(pageUrl);
  if (!fallback || fallback === candidate) {
    return NO_FAVICON;
  }

  // Returning the bare URL would make satori fetch it mid-render, and an
  // unreachable one leaves an empty box where the monogram should be.
  return fetchFavicon(fallback);
}
