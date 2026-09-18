import { fetchWithBrowserHeaders } from "@/lib/fetch";

const FAVICON_TIMEOUT_MS = 5000;
// Favicons are small by nature; anything larger is either broken or hostile.
// The whole payload is held in memory twice (raw bytes + base64 data URL).
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
  // @vercel/og currently doesn't support .ico reliably, so use PNG fallback.
  if (favicon && !/\.ico($|\?)/i.test(favicon)) {
    return favicon;
  }
  return getGoogleFaviconUrl(pageUrl);
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

async function fetchImageAsDataUrl(imageUrl: string) {
  if (!imageUrl) {
    return "";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FAVICON_TIMEOUT_MS);

  try {
    const response = await fetchWithBrowserHeaders(imageUrl, {
      headers: {
        Accept: "image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return "";
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("text/html")) {
      return "";
    }

    const declaredLength = Number(response.headers.get("content-length"));
    if (declaredLength > MAX_FAVICON_BYTES) {
      return "";
    }

    const bytes = await readBodyWithLimit(response, MAX_FAVICON_BYTES);
    if (!bytes) {
      return "";
    }

    const mimeType = detectFaviconMimeType(bytes, contentType);
    if (!mimeType) {
      return "";
    }

    return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveRenderableFaviconUrl(
  favicon: string,
  pageUrl: string
) {
  const candidate = resolveFaviconUrl(favicon, pageUrl);
  const resolvedCandidate = await fetchImageAsDataUrl(candidate);
  if (resolvedCandidate) {
    return resolvedCandidate;
  }

  const fallback = getGoogleFaviconUrl(pageUrl);
  if (!fallback || fallback === candidate) {
    return "";
  }

  const resolvedFallback = await fetchImageAsDataUrl(fallback);
  return resolvedFallback || fallback;
}
