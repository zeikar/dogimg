import { fetchWithBrowserHeaders } from "@/lib/fetch";

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
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

  try {
    const response = await fetchWithBrowserHeaders(imageUrl, {
      headers: {
        Accept: "image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return "";
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("text/html")) {
      return "";
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    const mimeType = detectFaviconMimeType(bytes, contentType);
    if (!mimeType) {
      return "";
    }

    return `data:${mimeType};base64,${bytesToBase64(bytes)}`;
  } catch {
    return "";
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
