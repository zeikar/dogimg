import React from "react";
import Image from "next/image";
import { rgbToHsl } from "@/lib/color.js";
import { FALLBACK_HEADER, getOgImagePath } from "@/lib/og-url";

interface PreviewImageProps {
  url: string;
  // Bumped on every submit, so a URL that failed can be tried again.
  attempt: number;
  isExample: boolean;
  // Told which requested card made it to the screen, so the snippets beside it
  // never offer a tag for a URL that produced no card. Empty for a fallback
  // card: the page behind it was never read.
  onShown: (url: string) => void;
}

const describeUrl = (url: string) =>
  url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

// The accent a card was drawn with, read back from the image: its top right
// corner is where the glow is strongest.
function readAccentHue(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d");
  if (!context || image.naturalWidth < 16) {
    return null;
  }

  context.drawImage(image, image.naturalWidth - 16, 0, 16, 16, 0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  const { h, s } = rgbToHsl({ r, g, b });
  return s > 0 ? h : null;
}

// Tints the page (see globals.css) with the card it is showing.
function followAccent(image: HTMLImageElement) {
  const hue = readAccentHue(image);
  if (hue === null) {
    return;
  }

  const root = document.documentElement;
  const current = Number(getComputedStyle(root).getPropertyValue("--hue"));
  // The short way around the wheel, so blue to red doesn't pass through green.
  const next = current + ((((hue - current) % 360) + 540) % 360) - 180;
  root.style.setProperty("--hue", String(next));
  // The second glow sits 30 degrees away, on the side the cards use.
  root.style.setProperty("--hue-alt", String(next + (hue < 90 ? -30 : 30)));
}

const PreviewImage: React.FC<PreviewImageProps> = ({ url, attempt, isExample, onShown }) => {
  const src = getOgImagePath(url);
  // Starts out showing the first card, so it is part of the server-rendered
  // page instead of arriving after hydration. That one is never fetched from
  // here, so whether it is a fallback is not known; it is taken not to be.
  const [displayed, setDisplayed] = React.useState({ src, url, fallback: false, attempt });
  const [failure, setFailure] = React.useState({ attempt: -1, reason: "" });
  const failed = failure.attempt === attempt;
  // A fallback is worth asking for again: the page behind it may be back.
  const upToDate =
    src === displayed.src && !(displayed.fallback && displayed.attempt !== attempt);
  const loading = !upToDate && !failed;

  // The card on screen stays until the next one has loaded.
  React.useEffect(() => {
    if (upToDate) {
      if (attempt > 0) {
        onShown(displayed.fallback ? "" : url);
      }
      return;
    }

    // fetch rather than an Image(): only a response shows its status and the
    // header that marks a fallback card.
    const controller = new AbortController();
    fetch(src, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          // A 400 carries the API's own one-line reason; anything else may be
          // a whole error page.
          const reason = response.status === 400 ? await response.text() : "";
          if (!controller.signal.aborted) {
            setFailure({ attempt, reason });
          }
          return;
        }

        // Read to the end, so the <img> below is served from the browser cache.
        // An Image() would have refused a body that isn't one; fetch doesn't.
        const body = await response.blob();
        if (controller.signal.aborted) {
          return;
        }
        if (!body.type.startsWith("image/") || body.size === 0) {
          setFailure({ attempt, reason: "" });
          return;
        }
        setDisplayed({ src, url, fallback: response.headers.has(FALLBACK_HEADER), attempt });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setFailure({ attempt, reason: "" });
        }
      });

    return () => controller.abort();
  }, [src, url, attempt, upToDate, displayed.fallback, onShown]);

  // On a phone the card sits below the fold, so a new request brings it up.
  const figure = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (attempt > 0) {
      figure.current?.scrollIntoView({ block: "nearest" });
    }
  }, [attempt]);

  const problem = !loading && (failed || displayed.fallback);
  let status = `${isExample ? "An example: the" : "The"} card for ${describeUrl(displayed.url)}`;
  if (loading) {
    status = `Fetching ${describeUrl(url)}…`;
  } else if (failed) {
    status = `No card for ${describeUrl(url)}. ${
      failure.reason || "The request didn't go through. Try again in a moment."
    }`;
  } else if (displayed.fallback) {
    status = `DOGimg couldn't read ${describeUrl(displayed.url)}, so this is the plain card it falls back to. Check the address, and that the page is public and answers with HTML.`;
  }

  return (
    <figure ref={figure} className="scroll-my-6">
      <div className="relative aspect-[1200/630] overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_2px_hsl(var(--hue)_35%_10%/0.08),0_14px_28px_-18px_hsl(var(--hue)_35%_10%/0.3)]">
        <Image
          // The fragment never reaches the server. It makes the address differ
          // when the same URL was fetched again, which is what gets an <img>
          // to look at the cache again instead of keeping what it has.
          src={displayed.attempt ? `${displayed.src}#${displayed.attempt}` : displayed.src}
          alt={`Open Graph card generated for ${describeUrl(displayed.url)}`}
          fill
          unoptimized
          loading="eager"
          fetchPriority="high"
          className={`object-cover transition-opacity duration-300 ${
            loading ? "opacity-40 motion-safe:animate-pulse" : ""
          }`}
          onLoad={(event) => followAccent(event.currentTarget)}
        />
      </div>
      <figcaption
        aria-live="polite"
        className={`mt-3 text-sm [overflow-wrap:anywhere] ${
          problem ? "font-bold text-red-700" : "text-muted"
        }`}
      >
        {status}
      </figcaption>
    </figure>
  );
};

export default PreviewImage;
