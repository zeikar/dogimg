import React from "react";
import Navbar from "@/components/navbar";
import Heading from "@/components/heading";
import PreviewImage from "@/components/preview";
import InputForm from "@/components/inputForm";
import Clipboard from "@/components/clipboard";
import { ApiReference, Faq, FAQ_ITEMS } from "@/components/docs";
import { SITE_URL } from "@/lib/og-url";

// Shown until the visitor generates a card of their own, so the page never
// opens on an empty frame.
const EXAMPLE_URL = "https://github.com";

// The headline shares the card's column, so the two end on the same edge.
// min-w-0: a grid column otherwise grows to fit a long unbroken URL.
const SPLIT = "grid gap-x-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] *:min-w-0";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    // WebSite is what Google reads a result's site name from. A
    // SoftwareApplication entry would only be flagged: it needs ratings.
    { "@type": "WebSite", name: "DOGimg", url: `${SITE_URL}/` },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function Home() {
  const [request, setRequest] = React.useState({ url: "", attempt: 0 });
  const [shownUrl, setShownUrl] = React.useState("");

  const handleGenerate = (targetUrl: string) => {
    setRequest(({ attempt }) => ({ url: targetUrl, attempt: attempt + 1 }));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      <Navbar />
      <main>
        <div className={SPLIT}>
          <Heading />
        </div>
        <InputForm handleSubmit={handleGenerate} />
        <div className={`${SPLIT} mt-8 gap-y-10 pb-16 sm:pb-20`}>
          <PreviewImage
            url={request.url || EXAMPLE_URL}
            attempt={request.attempt}
            isExample={!request.url}
            onShown={setShownUrl}
          />
          <Clipboard url={shownUrl} />
        </div>
        <ApiReference />
        <Faq />
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-8 text-sm text-muted">
        <p>DOGimg is short for Dynamic Open Graph image. Open source under the MIT license.</p>
        <a
          className="font-bold text-ink underline-offset-4 hover:underline"
          href="https://github.com/zeikar/dogimg"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub
        </a>
      </footer>
      <script
        type="application/ld+json"
        // "<" is escaped so that no answer text can close the script element.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
