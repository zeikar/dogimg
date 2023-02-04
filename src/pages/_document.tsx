import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head></Head>
      <body className="antialiased bg-gradient-to-r from-sky-400 via-cyan-300 to-green-300">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
