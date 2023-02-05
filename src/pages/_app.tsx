import "@/styles/globals.css";
import "@/styles/spinner.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>DOGimg - Dynamic Open Graph Image Generator With URL</title>
        <meta
          name="title"
          content="DOGimg - Dynamic Open Graph Image Generator With URL"
        />
        <meta
          name="description"
          content="A Dynamic Open Graph Image Generator With URL. Effortlessly generate stunning Open Graph Images with just a URL using our API."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dogimg.vercel.app/" />
        <meta property="og:site_name" content="DOGimg" />
        <meta
          property="og:title"
          content="DOGimg - Dynamic Open Graph Image Generator With URL"
        />
        <meta
          property="og:description"
          content="A Dynamic Open Graph Image Generator With URL. Effortlessly generate stunning Open Graph Images with just a URL using our API."
        />
        <meta
          property="og:image"
          content="https://dogimg.vercel.app/api/og?url=https://dogimg.vercel.app/"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://dogimg.vercel.app/" />
        <meta
          property="twitter:title"
          content="DOGimg - Dynamic Open Graph Image Generator With URL"
        />
        <meta
          property="twitter:description"
          content="A Dynamic Open Graph Image Generator With URL. Effortlessly generate stunning Open Graph Images with just a URL using our API."
        />
        <meta
          property="twitter:image"
          content="https://dogimg.vercel.app/api/og?url=https://dogimg.vercel.app/"
        />
        <link rel="canonical" href="https://dogimg.vercel.app/" />
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
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
