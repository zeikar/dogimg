import React from "react";
import { SITE_URL } from "@/lib/og-url";

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-[0.9em] text-ink">{children}</code>
);

const SECTION = "border-t border-line py-12 sm:py-16";
const SECTION_TITLE = "text-3xl font-bold tracking-[-0.02em] sm:text-4xl";

const RESPONSES = [
  {
    status: "200",
    body: (
      <>
        <Code>image/png</Code>, 1200×630. Cached for an hour in browsers and a day
        on the CDN. After that day, the next request still gets the old card
        while a fresh one is drawn behind it.
      </>
    ),
  },
  {
    status: "200",
    body: (
      <>
        When the page can&apos;t be fetched or isn&apos;t HTML, you still get an
        image: a plain card carrying the hostname, cached for five minutes at
        most. It is marked with an <Code>x-dogimg-fallback: 1</Code> header.
      </>
    ),
  },
  {
    status: "400",
    body: (
      <>
        Plain text. The <Code>url</Code> isn&apos;t http(s), has no hostname, or
        names a private or local address.
      </>
    ),
  },
  {
    status: "500",
    body: <>Plain text. The card could not be drawn.</>,
  },
];

export function ApiReference() {
  return (
    <section id="api" className={`${SECTION} scroll-mt-4`} aria-labelledby="api-title">
      <h2 id="api-title" className={SECTION_TITLE}>
        The Open Graph image API
      </h2>
      <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted">
        One endpoint, one parameter, no key. Put the URL straight into your{" "}
        <Code>og:image</Code> tag and crawlers from Slack, X, LinkedIn, Facebook,
        Discord and KakaoTalk will fetch the card themselves.
      </p>

      <pre className="mt-6 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-sm leading-relaxed text-white/90">
        <code>{`GET ${SITE_URL}/api/og?url={page URL}`}</code>
      </pre>

      {/* min-w-0: a grid column otherwise grows to fit its widest code line. */}
      <div className="mt-8 grid gap-x-12 gap-y-10 lg:grid-cols-2 *:min-w-0">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Parameter</h3>
          <dl className="mt-3 border-t border-line">
            <div className="grid grid-cols-[5rem_1fr] gap-4 border-b border-line py-3">
              <dt>
                <Code>url</Code>
              </dt>
              <dd className="leading-relaxed text-muted">
                The page to draw a card for. It has to be public and served over
                http or https; without a scheme, https is assumed. Pass it through{" "}
                <Code>encodeURIComponent</Code> if it has a query string of its
                own.
              </dd>
            </div>
          </dl>

          <h3 className="mt-8 text-lg font-bold tracking-tight">From the command line</h3>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-sm leading-relaxed text-white/90">
            <code>{`curl "${SITE_URL}/api/og?url=https://github.com" \\\n  --output og.png`}</code>
          </pre>
        </div>

        <div>
          <h3 className="text-lg font-bold tracking-tight">Responses</h3>
          <dl className="mt-3 border-t border-line">
            {RESPONSES.map((response, index) => (
              <div
                key={index}
                className="grid grid-cols-[5rem_1fr] gap-4 border-b border-line py-3 last:border-b-0"
              >
                <dt>
                  <Code>{response.status}</Code>
                </dt>
                <dd className="leading-relaxed text-muted">{response.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

// Plain strings: the same text is published as FAQPage structured data.
export const FAQ_ITEMS = [
  {
    question: "What is an Open Graph image?",
    answer:
      "It is the picture that appears when a link is shared in a chat app or on social media. A page declares it with the og:image meta tag; without one, most apps show a bare link or a badly cropped guess.",
  },
  {
    question: "Does it work with any website?",
    answer:
      "Any public page that answers with HTML. DOGimg doesn't run JavaScript, so the metadata has to be in the HTML your server sends. When a page can't be reached at all, you get a plain card with its hostname instead of an error.",
  },
  {
    question: "How do I choose the color of my card?",
    answer:
      "Declare a theme-color meta tag with a hex, rgb() or named color that isn't gray, white or black. Without one, DOGimg uses the dominant color of your favicon, and failing that a hue derived from your hostname.",
  },
  {
    question: "I changed my title. Why is the card still the old one?",
    answer:
      "Cards are cached for a day on the CDN, and the first request after that day is still answered with the old card while a new one is drawn. Apps like Slack, X and KakaoTalk keep their own copy of a link preview on top of that, and those are theirs to clear.",
  },
  {
    question: "Is it free? Do I need an API key?",
    answer:
      "It is free, open source under the MIT license, and needs no key. If you would rather not depend on this instance, deploy your own copy from the GitHub repository.",
  },
  {
    question: "Does a generated image help SEO?",
    answer:
      "Not as a ranking signal. What it changes is how your link looks once it is shared: a card with a title and a color gets noticed, and clicked, more often than a bare URL.",
  },
];

export function Faq() {
  return (
    <section className={SECTION} aria-labelledby="faq-title">
      <h2 id="faq-title" className={SECTION_TITLE}>
        Questions
      </h2>
      <dl className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question}>
            <dt className="text-lg font-bold tracking-tight">{item.question}</dt>
            <dd className="mt-2 leading-relaxed text-muted">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
