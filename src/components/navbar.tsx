import Image from "next/image";
import { SITE_URL } from "@/lib/og-url";

// Laid out like the header of a card: icon tile, site name, hostname.
export default function Navbar() {
  return (
    <header className="flex items-center justify-between gap-4 py-5 sm:py-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl border border-line bg-white">
          <Image src="/dog.svg" alt="" width={30} height={30} />
        </span>
        <span className="leading-tight">
          <span className="block text-lg font-bold tracking-tight">DOGimg</span>
          <span className="block text-sm text-muted">{new URL(SITE_URL).host}</span>
        </span>
      </div>

      <nav aria-label="Site" className="flex items-center gap-5 text-sm font-bold">
        <a
          className="flex items-center gap-2 underline-offset-4 hover:underline"
          href="https://github.com/zeikar/dogimg"
          target="_blank"
          rel="noreferrer"
        >
          <Image src="/github-mark.svg" alt="" width={20} height={20} />
          GitHub
        </a>
      </nav>
    </header>
  );
}
