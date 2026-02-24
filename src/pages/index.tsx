import React from "react";
import Navbar from "./components/navbar";
import Heading from "./components/heading";
import PreviewImage from "./components/preview";
import InputForm from "./components/inputForm";
import Clipboard from "./components/clipboard";

export default function Home() {
  const [ogApi, setOgApi] = React.useState("");
  const [url, setUrl] = React.useState("");

  const handleGenerate = (url: string) => {
    console.log("Generate", url);
    setUrl(url);
    setOgApi(`/api/og?url=${encodeURIComponent(url)}`);
  };

  return (
    <>
      <header>
        <Navbar />
      </header>
      <div className="w-full">
        <Heading />
      </div>
      <main className="container mx-auto mt-1 mb-2 max-w-5xl space-y-4">
        <div
          className="
            flex
            flex-col
            justify-center
            items-center
            bg-white
            mx-auto
            rounded-lg
            shadow-lg
          "
        >
          <div className="w-full">
            <InputForm handleSubmit={handleGenerate} />
          </div>
          <div className="w-full">
            <PreviewImage src={ogApi} />
          </div>
          <div className="w-full">
            <Clipboard url={url} />
          </div>
        </div>
        <section
          className="mx-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
          aria-labelledby="seo-content-title"
        >
          <h2
            id="seo-content-title"
            className="text-xl font-semibold text-slate-700 sm:text-2xl"
          >
            Generate Dynamic Open Graph Images in Seconds
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            DOGimg lets you create dynamic Open Graph previews from any URL.
            Paste a webpage link, generate an OG image instantly, and add the
            meta tag to improve social sharing on platforms like X, LinkedIn,
            and Facebook.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <h3 className="text-sm font-semibold text-slate-700 sm:text-base">
                How it works
              </h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                <li>Enter any webpage URL.</li>
                <li>Generate a polished Open Graph image preview.</li>
                <li>Copy the meta tag and paste it into your page head.</li>
              </ol>
            </article>

            <article className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <h3 className="text-sm font-semibold text-slate-700 sm:text-base">
                Use cases
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>Blog and docs share previews</li>
                <li>Product launch and campaign pages</li>
                <li>Portfolio and landing page optimization</li>
              </ul>
            </article>
          </div>

          <article className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-slate-700 sm:text-base">
              FAQ
            </h3>
            <dl className="mt-2 space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-medium text-slate-700">
                  Can I use this with any website URL?
                </dt>
                <dd>
                  Yes. DOGimg attempts to fetch metadata from public webpages and
                  render a share-ready OG card image.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-700">
                  Is this useful for SEO and social sharing?
                </dt>
                <dd>
                  Yes. It helps you publish a consistent Open Graph image URL,
                  which improves preview quality across social platforms.
                </dd>
              </div>
            </dl>
          </article>
        </section>
      </main>
      <footer className=""></footer>
    </>
  );
}
