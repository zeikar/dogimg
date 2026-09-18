export class InvalidTargetUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidTargetUrlError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "0.0.0.0",
  "::",
  "::1",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPrivateIpv4(hostname) {
  const match = hostname.match(IPV4_PATTERN);
  if (!match) {
    return false;
  }

  const [a, b] = match.slice(1, 3).map(Number);
  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) {
    return true;
  }

  return (
    a === 0 || // "this network"
    a === 10 || // private
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    a >= 224 // multicast and reserved
  );
}

function isPrivateIpv6(hostname) {
  // fc00::/7 (unique local) and fe80::/10 (link-local)
  return /^f[cd][0-9a-f]{2}:/i.test(hostname) || /^fe[89ab][0-9a-f]:/i.test(hostname);
}

function isBlockedHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");

  return (
    BLOCKED_HOSTNAMES.has(host) ||
    BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
    isPrivateIpv4(host) ||
    isPrivateIpv6(host)
  );
}

function parseHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

// Normalizes user input into an http(s) URL that is safe to fetch server-side.
//
// Note the limits: this rejects literal private addresses only. A public
// hostname whose DNS record points at a private address still gets fetched,
// which is why fetchHTML re-checks the URL it actually landed on.
export function normalizeTargetUrl(rawUrl) {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    throw new InvalidTargetUrlError("The url parameter is empty.");
  }

  // "ftp://host" carries an explicit scheme, so it must not be re-prefixed;
  // "example.com:8080" has no scheme and should become https://example.com:8080.
  const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const parsed =
    parseHttpUrl(trimmed) ||
    (hasExplicitScheme ? null : parseHttpUrl(`https://${trimmed}`));

  if (!parsed) {
    throw new InvalidTargetUrlError("The url parameter is not an http(s) URL.");
  }

  if (!parsed.hostname) {
    throw new InvalidTargetUrlError("The url parameter has no hostname.");
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new InvalidTargetUrlError(
      `Refusing to fetch a private or local address: ${parsed.hostname}`
    );
  }

  return parsed.toString();
}

export function assertPublicHttpUrl(url) {
  normalizeTargetUrl(url);
  return url;
}
