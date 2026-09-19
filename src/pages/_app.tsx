import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import localFont from "next/font/local";
import { SITE_URL, getOgImageUrl } from "@/lib/og-url";

const SITE_HOME = `${SITE_URL}/`;
const SITE_OG_IMAGE = getOgImageUrl(SITE_HOME);

// The same files the cards are rendered with, so the page and its output share
// a typeface.
const notoSans = localFont({
  src: [
    { path: "../assets/fonts/noto-sans-latin-400.woff", weight: "400" },
    { path: "../assets/fonts/noto-sans-latin-700.woff", weight: "700" },
  ],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>DOGimg - Dynamic Open Graph Images from Any URL</title>
        <meta
          name="title"
          content="DOGimg - Dynamic Open Graph Images from Any URL"
        />
        <meta
          name="description"
          content="Generate polished Open Graph images from any URL in seconds."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_HOME} />
        <meta property="og:site_name" content="DOGimg" />
        <meta
          property="og:title"
          content="DOGimg - Dynamic Open Graph Images from Any URL"
        />
        <meta
          property="og:description"
          content="Generate polished Open Graph images from any URL in seconds."
        />
        <meta property="og:image" content={SITE_OG_IMAGE} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={SITE_HOME} />
        <meta
          property="twitter:title"
          content="DOGimg - Dynamic Open Graph Images from Any URL"
        />
        <meta
          property="twitter:description"
          content="Generate polished Open Graph images from any URL in seconds."
        />
        <meta property="twitter:image" content={SITE_OG_IMAGE} />
        <link rel="canonical" href={SITE_HOME} />
        <link rel="apple-touch-icon" href="/dog.svg" />
        <meta name="theme-color" content="#67e8f9" />
        <meta name="msapplication-TileColor" content="#67e8f9" />
        <meta name="msapplication-TileImage" content="/dog.svg" />
        <meta name="application-name" content="DOGimg" />
        <meta name="apple-mobile-web-app-title" content="DOGimg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/dog.svg" />
      </Head>
      <div className={notoSans.className}>
        <Component {...pageProps} />
      </div>
      <Analytics />
    </>
  );
}
