import React from "react";
import Image from "next/image";
import { rgbToHsl } from "@/lib/color.js";
import { getOgImagePath } from "@/lib/og-url";

interface PreviewImageProps {
  url: string;
  // Bumped on every submit, so a URL that failed can be tried again.
  attempt: number;
  isExample: boolean;
  // Told which requested card made it to the screen, so the snippets beside it
  // never offer a tag for a URL that produced no card.
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
  // page instead of arriving after hydration.
  const [displayed, setDisplayed] = React.useState({ src, url });
  const [failedAttempt, setFailedAttempt] = React.useState(-1);
  const failed = failedAttempt === attempt;
  const loading = src !== displayed.src && !failed;

  // The card on screen stays until the next one has loaded.
  React.useEffect(() => {
    if (src === displayed.src) {
      if (attempt > 0) {
        onShown(url);
      }
      return;
    }

    let cancelled = false;
    const preloader = new window.Image();
    preloader.onload = () => {
      if (!cancelled) {
        setDisplayed({ src, url });
      }
    };
    preloader.onerror = () => {
      if (!cancelled) {
        setFailedAttempt(attempt);
      }
    };
    preloader.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, url, attempt, displayed.src, onShown]);

  // On a phone the card sits below the fold, so a new request brings it up.
  const figure = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    if (attempt > 0) {
      figure.current?.scrollIntoView({ block: "nearest" });
    }
  }, [attempt]);

  let status = `${isExample ? "An example: the" : "The"} card for ${describeUrl(displayed.url)}`;
  if (loading) {
    status = `Fetching ${describeUrl(url)}…`;
  } else if (failed) {
    status = `No card for ${describeUrl(url)}. DOGimg only reads public http(s) pages; check the address and try again.`;
  }

  return (
    <figure ref={figure} className="scroll-my-6">
      <div className="relative aspect-[1200/630] overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_2px_hsl(var(--hue)_35%_10%/0.08),0_14px_28px_-18px_hsl(var(--hue)_35%_10%/0.3)]">
        <Image
          src={displayed.src}
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
          failed ? "font-bold text-red-700" : "text-muted"
        }`}
      >
        {status}
      </figcaption>
    </figure>
  );
};

export default PreviewImage;
