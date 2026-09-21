import test from "node:test";
import assert from "node:assert/strict";
import {
  InvalidTargetUrlError,
  isPrivateAddress,
  normalizeTargetUrl,
} from "../src/lib/target-url.js";

test("accepts public http(s) urls", () => {
  assert.equal(normalizeTargetUrl("https://github.com"), "https://github.com/");
  assert.equal(
    normalizeTargetUrl("http://example.com/post?id=1"),
    "http://example.com/post?id=1"
  );
});

test("adds https to a bare hostname, keeping an explicit port", () => {
  assert.equal(normalizeTargetUrl("example.com"), "https://example.com/");
  assert.equal(
    normalizeTargetUrl("example.com:8080"),
    "https://example.com:8080/"
  );
});

test("rejects schemes other than http(s)", () => {
  for (const value of [
    "file:///etc/passwd",
    "ftp://example.com",
    "javascript:alert(1)",
    "data:text/html,<h1>x</h1>",
    // Previously accepted: the old check was url.startsWith("http").
    "httpx://evil.example",
  ]) {
    assert.throws(
      () => normalizeTargetUrl(value),
      InvalidTargetUrlError,
      `expected ${value} to be rejected`
    );
  }
});

test("rejects loopback and link-local hosts", () => {
  for (const value of [
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://[::1]/",
    "http://0.0.0.0",
    // Cloud instance metadata.
    "http://169.254.169.254/latest/meta-data/",
  ]) {
    assert.throws(
      () => normalizeTargetUrl(value),
      InvalidTargetUrlError,
      `expected ${value} to be rejected`
    );
  }
});

test("rejects private addresses written as ipv4-mapped ipv6", () => {
  for (const value of [
    "http://[::ffff:127.0.0.1]/",
    "http://[::ffff:a9fe:a9fe]/", // 169.254.169.254
    "http://[::ffff:10.0.0.5]/",
  ]) {
    assert.throws(
      () => normalizeTargetUrl(value),
      InvalidTargetUrlError,
      `expected ${value} to be rejected`
    );
  }
});

test("classifies resolved addresses of both families", () => {
  for (const address of [
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "0.0.0.0",
    "::1",
    "::",
    "fd12:3456::1",
    "fe80::1",
    "::ffff:192.168.0.1",
    "fe80::1%eth0",
    "64:ff9b::1%eth0",
    "192.0.0.192",
    // NAT64 carries an IPv4 address in its last 32 bits.
    "64:ff9b::a00:5",
    "64:ff9b::7f00:1",
    "64:ff9b::",
  ]) {
    assert.equal(isPrivateAddress(address), true, address);
  }
  for (const address of [
    "93.184.215.14",
    "2606:4700::6810:84e5",
    "::ffff:8.8.8.8",
    "64:ff9b::808:808",
  ]) {
    assert.equal(isPrivateAddress(address), false, address);
  }
});

test("rejects private ipv4 ranges", () => {
  for (const value of [
    "http://10.0.0.5",
    "http://172.16.0.1",
    "http://172.31.255.255",
    "http://192.168.1.1",
    "http://100.64.0.1",
  ]) {
    assert.throws(
      () => normalizeTargetUrl(value),
      InvalidTargetUrlError,
      `expected ${value} to be rejected`
    );
  }
});

test("allows public addresses that merely look adjacent to private ranges", () => {
  for (const value of [
    "http://172.32.0.1",
    "http://172.15.0.1",
    "http://11.0.0.1",
    "http://192.169.1.1",
  ]) {
    assert.equal(normalizeTargetUrl(value), `${value}/`);
  }
});

test("rejects internal-only hostname suffixes", () => {
  for (const value of [
    "http://db.internal",
    "http://printer.local",
    "http://app.localhost",
  ]) {
    assert.throws(() => normalizeTargetUrl(value), InvalidTargetUrlError);
  }
});

test("rejects empty input", () => {
  assert.throws(() => normalizeTargetUrl(""), InvalidTargetUrlError);
  assert.throws(() => normalizeTargetUrl("   "), InvalidTargetUrlError);
});
