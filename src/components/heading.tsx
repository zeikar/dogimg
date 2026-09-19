export default function Heading() {
  return (
    <div className="pt-2 pb-8 sm:pt-4">
      <h1 className="text-[clamp(2.5rem,5.6vw,4rem)] leading-[1.05] font-bold tracking-[-0.03em] text-balance">
        Turn any URL into an Open Graph image
      </h1>
      <p className="mt-4 max-w-[64ch] text-lg leading-normal text-muted sm:text-xl sm:leading-normal text-pretty">
        Add one <code className="font-mono text-[0.9em] text-ink">og:image</code>{" "}
        tag, and every page you share gets its own preview card: its title, its
        icon, its color. Nothing to design, nothing to deploy.
      </p>
    </div>
  );
}
