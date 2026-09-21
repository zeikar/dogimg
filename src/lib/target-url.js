import { BlockList, isIP } from "node:net";

export class InvalidTargetUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidTargetUrlError";
  }
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];

const PRIVATE_ADDRESSES = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.168.0.0", 16], // private
  ["224.0.0.0", 3], // multicast and reserved
]) {
  PRIVATE_ADDRESSES.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
]) {
  PRIVATE_ADDRESSES.addSubnet(network, prefix, "ipv6");
}

const NAT64 = new BlockList();
NAT64.addSubnet("64:ff9b::", 96, "ipv6");

// Behind a NAT64 gateway, 64:ff9b::a00:5 reaches 10.0.0.5: the last 32 bits
// are the IPv4 address. Refusing the whole prefix instead would cut such a
// host off from every IPv4-only site.
function getNat64Ipv4(address) {
  // Canonical text within this prefix is "64:ff9b::" and up to two groups.
  const groups = new URL(`http://[${address}]/`).hostname
    .slice("[64:ff9b::".length, -1)
    .split(":")
    .filter(Boolean)
    .map((group) => parseInt(group, 16));
  const [high, low] = [0, 0, ...groups].slice(-2);
  return [high >> 8, high & 255, low >> 8, low & 255].join(".");
}

// BlockList matches an IPv4-mapped IPv6 address (::ffff:10.0.0.5) against the
// IPv4 ranges, which a pattern over the text would miss.
export function isPrivateAddress(address) {
  const family = isIP(address);
  // A zone ID (fe80::1%eth0) only ever scopes an address to a local link.
  if (family === 6 && address.includes("%")) {
    return true;
  }
  if (family === 6 && NAT64.check(address, "ipv6")) {
    return isPrivateAddress(getNat64Ipv4(address));
  }
  return (
    family !== 0 &&
    PRIVATE_ADDRESSES.check(address, family === 4 ? "ipv4" : "ipv6")
  );
}

function isBlockedHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");

  return (
    BLOCKED_HOSTNAMES.has(host) ||
    BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
    isPrivateAddress(host)
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
// This judges the URL alone, so it can only reject an address written into
// it. Where a hostname resolves to, and where a redirect leads, is checked
// when the connection is made: see publicOnlyDispatcher in fetch.js.
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
