import { assertPublicHttpUrl } from "./target-url.js";

const BROWSER_LIKE_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent":
    "Mozilla/5.0 (compatible; DOGimgBot/1.0; +https://dogimg.vercel.app)",
};

// Some runtimes refuse a caller supplied User-Agent and throw instead of
// ignoring it, so the request never leaves and resending without the header
// costs nothing. Everything else has to propagate: fetch reports ordinary
// network failures as TypeError too, and retrying one would send it twice.
function shouldRetryWithoutUserAgent(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("user-agent")) {
    return true;
  }

  // A restriction names the header it is about; a bare "forbidden" is a
  // transport error, and a 403 response does not reach here at all.
  return (
    message.includes("header") &&
    (message.includes("forbidden") ||
      message.includes("immutable") ||
      message.includes("unsafe"))
  );
}

export async function fetchWithBrowserHeaders(url, init = {}) {
  const headers = new Headers(BROWSER_LIKE_HEADERS);
  if (init.headers) {
    const customHeaders = new Headers(init.headers);
    customHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  const requestInit = {
    ...init,
    headers,
    redirect: init.redirect || "follow",
  };

  try {
    return await fetch(url, requestInit);
  } catch (error) {
    if (!shouldRetryWithoutUserAgent(error)) {
      throw error;
    }

    const retryHeaders = new Headers(headers);
    retryHeaders.delete("User-Agent");
    return fetch(url, {
      ...requestInit,
      headers: retryHeaders,
    });
  }
}

// get html from url
export const fetchHTML = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetchWithBrowserHeaders(url, {
      signal: controller.signal,
    });

    // Redirects are followed, so the request can land somewhere the caller
    // never asked for. Re-check before any of that content reaches the image.
    assertPublicHttpUrl(response.url || url);

    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status}`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html")) {
      throw new Error(`Invalid content-type: ${contentType || "unknown"}`);
    }

    const html = await response.text();
    // Keep memory usage stable for very large pages.
    return html.slice(0, 2_000_000);
  } finally {
    clearTimeout(timeout);
  }
};
