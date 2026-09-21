import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

const API_ORIGIN = "https://dogimg.vercel.app";
// Set to "1" on a card drawn without the page, e.g. when it can't be reached.
const FALLBACK_HEADER = "x-dogimg-fallback";
// An uncached card takes a few seconds; a slow target page can add ten more.
const TIMEOUT_MS = 30_000;

const USAGE = `Usage: dogimg <url> [-o <file>]

Saves the Open Graph card that ${API_ORIGIN} draws for <url>
as a 1200x630 PNG.

Options:
  -o, --output <file>  Where to save the card (default: og.png)
  -h, --help           Show this message`;

// Returns the exit code, so the caller decides how the process ends.
export async function run(args) {
  let parsed;
  try {
    parsed = parseArgs({
      args,
      allowPositionals: true,
      options: {
        output: { type: "string", short: "o", default: "og.png" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (e) {
    console.error(`dogimg: ${e.message}\n\n${USAGE}`);
    return 1;
  }

  const { values, positionals } = parsed;
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  // The API draws its default page for an empty url, which would pass for success.
  if (positionals.length !== 1 || !positionals[0].trim()) {
    console.error(USAGE);
    return 1;
  }

  const [target] = positionals;
  const output = values.output;
  const request = new URL("/api/og", API_ORIGIN);
  request.searchParams.set("url", target);

  let response;
  let bytes;
  try {
    response = await fetch(request, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    bytes = new Uint8Array(await response.arrayBuffer());
  } catch (e) {
    const reason =
      e.name === "TimeoutError"
        ? "timed out"
        : e.cause?.message || e.cause?.code || e.message;
    console.error(`dogimg: request to ${API_ORIGIN} failed: ${reason}`);
    return 1;
  }

  // The API answers errors in plain text; saving that as a .png is what a bare
  // curl does, and the broken file only shows up later.
  if (!response.ok) {
    const message = new TextDecoder().decode(bytes).trim();
    console.error(`dogimg: ${response.status}: ${message || response.statusText}`);
    return 1;
  }

  try {
    await writeFile(output, bytes);
  } catch (e) {
    console.error(`dogimg: couldn't write ${output}: ${e.message}`);
    return 1;
  }

  if (response.headers.get(FALLBACK_HEADER) === "1") {
    console.error(
      `dogimg: couldn't read ${target}, so ${output} is a plain fallback card ` +
        "carrying only the hostname."
    );
    return 1;
  }

  console.log(`Saved ${output}`);
  return 0;
}
