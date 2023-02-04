import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>
          DOGimg - Dynamic Open Graph Image Generator With Meta Data
        </title>
        <meta
          name="description"
          content="DOGimg - A Dynamic Open Graph Image Generator"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/dog.svg" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
