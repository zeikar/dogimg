export const SITE_URL = "https://dogimg.vercel.app";

// Query params in the target URL must be encoded, otherwise they leak into
// DOGimg's own query string and the target URL gets truncated.
export const getOgImagePath = (url: string) =>
  `/api/og?url=${encodeURIComponent(url)}`;

export const getOgImageUrl = (url: string) => `${SITE_URL}${getOgImagePath(url)}`;
