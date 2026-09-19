import React, { useState } from "react";
import ClickItem from "./clickItem";

interface InputFormProps {
  handleSubmit: (url: string) => void;
}

// Four sites whose cards come out in four different colors. The hue is the one
// their card is drawn in, shown as a dot so the idea is visible before a click.
const EXAMPLES = [
  { url: "https://github.com", hue: 192 },
  { url: "https://www.youtube.com", hue: 348 },
  { url: "https://www.spotify.com", hue: 142 },
  { url: "https://stripe.com", hue: 248 },
];

const InputForm = ({ handleSubmit }: InputFormProps) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const isValidUrl = (value: string) => {
    try {
      const normalized = /^https?:\/\//i.test(value) ? value : `http://${value}`;
      const parsed = new URL(normalized);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!isValidUrl(trimmedUrl)) {
      setError("That doesn't look like a URL. Try something like your-site.com/post.");
      return;
    }
    setError("");
    handleSubmit(trimmedUrl);
  };

  const selectUrl = (selectedUrl: string) => {
    setError("");
    setUrl(selectedUrl);
    handleSubmit(selectedUrl);
  };

  return (
    <div>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="page-url" className="sr-only">
          Page URL
        </label>
        {/* The field is the API call itself: what you type is the url parameter. */}
        <div className="flex flex-wrap items-stretch rounded-2xl border border-line bg-white shadow-[0_12px_32px_-16px_hsl(var(--hue)_40%_30%/0.35)] focus-within:border-ink focus-within:ring-2 focus-within:ring-accent/30 sm:flex-nowrap">
          <span
            aria-hidden="true"
            className="flex items-center pl-4 font-mono text-base text-ink/75 sm:pl-5 sm:text-lg"
          >
            /api/og?url=
          </span>
          <input
            id="page-url"
            className="min-w-0 flex-1 bg-transparent py-4 pr-2 pl-1 font-mono text-base text-ink placeholder:text-muted focus:outline-hidden sm:text-lg"
            type="url"
            inputMode="url"
            placeholder="your-site.com/post"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "url-input-error" : undefined}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) {
                setError("");
              }
            }}
            required
          />
          <button
            className="m-1.5 basis-full rounded-xl bg-ink px-6 py-3 font-bold text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:shrink-0 sm:basis-auto sm:py-0"
            type="submit"
          >
            Generate card
          </button>
        </div>
        {error ? (
          <p id="url-input-error" role="alert" className="mt-2 text-sm font-bold text-red-700">
            {error}
          </p>
        ) : null}
      </form>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        Or try one of these:
        {EXAMPLES.map((example) => (
          <ClickItem key={example.url} {...example} onSelect={selectUrl} />
        ))}
      </p>
    </div>
  );
};

export default InputForm;
