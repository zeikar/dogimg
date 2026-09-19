// @vercel/og cannot rasterize .ico, so such an icon is never a usable
// candidate: the parser skips it when choosing, and the fetcher swaps it
// for a PNG fallback.
const ICO_PATTERN = /\.ico(?:$|[?#])/i;

export function isRenderableIconHref(href) {
  return Boolean(href) && !ICO_PATTERN.test(href);
}
