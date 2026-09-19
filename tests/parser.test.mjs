import test from "node:test";
import assert from "node:assert/strict";
import { getSiteMetaDataFromHTML } from "../src/lib/parser.js";

test("prefers light theme-color when light and dark are both present", () => {
  const html = `
    <html>
      <head>
        <title>Fallback Title</title>
        <meta property="og:title" content="Open Graph Title" />
        <meta property="og:description" content="Open Graph Description" />
        <meta property="og:site_name" content="My Site" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FAFAFA" />
        <link rel="icon" href="/favicon.png" />
      </head>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://example.com/path", html);

  assert.equal(meta.title, "Open Graph Title");
  assert.equal(meta.description, "Open Graph Description");
  assert.equal(meta.site_name, "My Site");
  assert.equal(meta.color, "#FAFAFA");
  assert.equal(meta.favicon, "https://example.com/favicon.png");
});

test("falls back to no-media theme-color and title tag when OG tags are missing", () => {
  const html = `
    <html>
      <head>
        <title>Document Title</title>
        <meta name="theme-color" content="#112233" />
        <link rel="icon" href="assets/icon.svg" />
      </head>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://www.sample.dev/docs", html);

  assert.equal(meta.title, "Document Title");
  assert.equal(meta.description, "");
  assert.equal(meta.site_name, "www.sample.dev");
  assert.equal(meta.color, "#112233");
  assert.equal(meta.favicon, "https://www.sample.dev/assets/icon.svg");
});

test("uses description priority: og > twitter > meta description", () => {
  const htmlWithoutOg = `
    <html>
      <head>
        <title>Document Title</title>
        <meta name="twitter:description" content="Twitter Description" />
        <meta name="description" content="Meta Description" />
      </head>
    </html>
  `;

  const metaWithoutOg = getSiteMetaDataFromHTML(
    "https://example.com",
    htmlWithoutOg
  );
  assert.equal(metaWithoutOg.description, "Twitter Description");

  const htmlWithOg = `
    <html>
      <head>
        <title>Document Title</title>
        <meta name="twitter:description" content="Twitter Description" />
        <meta name="description" content="Meta Description" />
        <meta property="og:description" content="OG Description" />
      </head>
    </html>
  `;

  const metaWithOg = getSiteMetaDataFromHTML("https://example.com", htmlWithOg);
  assert.equal(metaWithOg.description, "OG Description");
});

test("ignores unsupported ico favicons and returns default color for invalid theme-color", () => {
  const html = `
    <html>
      <head>
        <title>ICO Only</title>
        <meta name="theme-color" content="black" />
        <link rel="icon" href="/favicon.ico" />
      </head>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://dogimg.vercel.app", html);

  assert.equal(meta.favicon, "");
  assert.equal(meta.color, "#bbbbbb");
});

test("returns safe defaults when metadata is completely missing", () => {
  const html = `
    <html>
      <body>
        <div>No metadata here</div>
      </body>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://empty.example/path", html);

  assert.equal(meta.title, "");
  assert.equal(meta.description, "");
  assert.equal(meta.site_name, "empty.example");
  assert.equal(meta.color, "#bbbbbb");
  assert.equal(meta.favicon, "");
});

test("returns safe defaults when html is an empty string", () => {
  const meta = getSiteMetaDataFromHTML("https://empty-string.example", "");

  assert.equal(meta.title, "");
  assert.equal(meta.description, "");
  assert.equal(meta.site_name, "empty-string.example");
  assert.equal(meta.color, "#bbbbbb");
  assert.equal(meta.favicon, "");
});

test("picks the largest sized favicon when multiple are declared", () => {
  const html = `
    <html>
      <head>
        <title>Multi-size icons</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
      </head>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://example.com", html);
  assert.equal(meta.favicon, "https://example.com/android-chrome-192x192.png");
});

test("prefers SVG icon over larger raster icons", () => {
  const html = `
    <html>
      <head>
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
      </head>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://example.com", html);
  assert.equal(meta.favicon, "https://example.com/icon.svg");
});

test("treats sizes=\"any\" as a high-priority candidate", () => {
  const html = `
    <html>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/small.png" />
        <link rel="icon" sizes="any" href="/scalable.png" />
      </head>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://example.com", html);
  assert.equal(meta.favicon, "https://example.com/scalable.png");
});

test("uses apple-touch-icon when no sized icons are present", () => {
  const html = `
    <html>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/icon.png" />
      </head>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://example.com", html);
  assert.equal(meta.favicon, "https://example.com/apple-touch-icon.png");
});

test("skips .ico icons carrying a query string or fragment", () => {
  const html = `
    <html>
      <head>
        <link rel="icon" href="/favicon.ico?v=3" />
        <link rel="icon" href="/favicon.ico#v4" />
        <link rel="icon" type="image/png" sizes="64x64" href="/icon-64.png" />
      </head>
    </html>
  `;

  const meta = getSiteMetaDataFromHTML("https://example.com", html);
  assert.equal(meta.favicon, "https://example.com/icon-64.png");
});
