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
