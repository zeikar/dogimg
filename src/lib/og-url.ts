const FALLBACK_SITE_URL = "https://dogimg.vercel.app";

// Set NEXT_PUBLIC_SITE_URL so local and preview builds stop handing out
// production links. Inlined at build time, so it must carry the NEXT_PUBLIC
// prefix to survive into the browser bundle.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL
).replace(/\/+$/, "");

// Query params in the target URL must be encoded, otherwise they leak into
// DOGimg's own query string and the target URL gets truncated.
export const getOgImagePath = (url: string) =>
  `/api/og?url=${encodeURIComponent(url)}`;

export const getOgImageUrl = (url: string) => `${SITE_URL}${getOgImagePath(url)}`;

// Set to "1" on a fallback card. It is a 200 and a PNG like any other card, so
// without this a caller can't tell that the page was never read.
export const FALLBACK_HEADER = "x-dogimg-fallback";
