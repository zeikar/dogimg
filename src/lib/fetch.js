import dns from "node:dns";
import { isIP } from "node:net";
// Reached through the module object rather than destructured, so that tests
// can stub undici.fetch the way they would stub a global.
import undici from "undici";
import {
  InvalidTargetUrlError,
  assertPublicHttpUrl,
  isPrivateAddress,
} from "./target-url.js";

function refuseAddress(address) {
  return new InvalidTargetUrlError(
    `Refusing to connect to a private or local address: ${address}`
  );
}

// The socket connects to exactly the addresses checked here. Resolving once
// to check and letting fetch resolve again would leave room for a DNS answer
// that changes in between.
export function lookupPublicAddress(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) {
      callback(error);
      return;
    }

    const refused = addresses.find(({ address }) => isPrivateAddress(address));
    if (refused) {
      callback(refuseAddress(refused.address));
      return;
    }

    if (options.all) {
      callback(null, addresses);
    } else {
      callback(null, addresses[0].address, addresses[0].family);
    }
  });
}

const connectPublic = undici.buildConnector({ lookup: lookupPublicAddress });

// Every connection a request opens goes through here, redirect hops included,
// so a public page can't lead the fetch to an internal one. Node connects to
// an IP without a lookup, which is why an IP is checked before connecting.
export const publicOnlyDispatcher = new undici.Agent({
  connect(options, callback) {
    if (isIP(options.hostname) && isPrivateAddress(options.hostname)) {
      callback(refuseAddress(options.hostname), null);
      return;
    }
    connectPublic(options, callback);
  },
});

const BROWSER_LIKE_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent":
    "Mozilla/5.0 (compatible; DOGimgBot/1.0; +https://dogimg.vercel.app)",
};

export async function fetchWithBrowserHeaders(url, init = {}) {
  const headers = new Headers(BROWSER_LIKE_HEADERS);
  if (init.headers) {
    const customHeaders = new Headers(init.headers);
    customHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return undici.fetch(url, {
    ...init,
    headers,
    redirect: init.redirect || "follow",
    dispatcher: publicOnlyDispatcher,
  });
}

// For any URL that did not come from this service itself. Reaching a private
// address is the harm whether or not the response is used, so nothing may be
// sent there: a URL naming one is refused here, before any request, and a
// hostname or redirect that leads to one is refused by publicOnlyDispatcher.
export async function fetchPublicUrl(url, init) {
  assertPublicHttpUrl(url);
  return fetchWithBrowserHeaders(url, init);
}

// get html from url
export const fetchHTML = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetchPublicUrl(url, { signal: controller.signal });

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
