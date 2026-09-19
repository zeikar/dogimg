const FONT_FAMILY = "Noto Sans";
const FALLBACK_FAMILY = "Noto Sans Fallback";
export const FONT_STACK = `"${FONT_FAMILY}", "${FALLBACK_FAMILY}"`;

const FALLBACK_TIMEOUT_MS = 3000;

// Passing `fonts` replaces @vercel/og's built-in Regular, so both weights ship
// here. Without a 700 face Satori renders every fontWeight as Regular.
const bundledFonts = Promise.all(
  [
    fetch(new URL("../assets/fonts/noto-sans-latin-400.woff", import.meta.url)),
    fetch(new URL("../assets/fonts/noto-sans-latin-700.woff", import.meta.url)),
  ].map(async (response) => (await response).arrayBuffer())
);

// @vercel/og fetches glyphs the bundled subsets lack on its own, but only at
// weight 400 — a Korean headline would sit Regular next to a bold Latin one.
// So CJK is loaded here in both weights instead. First match wins: Hangul and
// kana identify the language outright, while bare Han is most often Chinese.
const FALLBACK_SOURCES = [
  { family: "Noto+Sans+KR", script: /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/ },
  { family: "Noto+Sans+JP", script: /[\u3040-\u30ff]/ },
  { family: "Noto+Sans+SC", script: /[\u4e00-\u9fff]/ },
];

const FONT_FACE_PATTERN =
  /font-weight:\s*(400|700);\s*src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/g;

async function loadFallbackFaces(text: string) {
  const source = FALLBACK_SOURCES.find(({ script }) => script.test(text));
  if (!source) {
    return [];
  }

  const glyphs = [...new Set(text)].filter((char) => char > "\u02ff").join("");
  const signal = AbortSignal.timeout(FALLBACK_TIMEOUT_MS);

  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${source.family}:wght@400;700&text=${encodeURIComponent(glyphs)}`,
      {
        signal,
        // Google serves woff2 to anything modern, which Satori can't read. An
        // old Safari gets TrueType — the same trick @vercel/og uses.
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
        },
      }
    ).then((response) => response.text());

    const faces = [...css.matchAll(FONT_FACE_PATTERN)];
    // Both or nothing: with only the 700 face registered, Satori would reach
    // for it to fill Regular text too and embolden stray characters.
    if (faces.length !== 2) {
      throw new Error("expected a 400 and a 700 TrueType face from Google Fonts");
    }

    return await Promise.all(
      faces.map(async ([, weight, url]) => {
        const response = await fetch(url, { signal });
        if (!response.ok) {
          throw new Error(`font download failed: ${response.status}`);
        }

        return {
          name: FALLBACK_FAMILY,
          data: await response.arrayBuffer(),
          weight: Number(weight) as 400 | 700,
        };
      })
    );
  } catch (e) {
    // The card still renders: @vercel/og loads those glyphs itself, Regular.
    console.error(`[og] fallback fonts unavailable (${source.family}):`, e);
    return [];
  }
}

// `text` is everything the card prints; it decides whether fallback faces are
// needed and which glyphs they have to carry.
export async function loadCardFonts(text: string) {
  const [[regular, bold], fallbackFaces] = await Promise.all([
    bundledFonts,
    loadFallbackFaces(text),
  ]);

  return [
    { name: FONT_FAMILY, data: regular, weight: 400 as const },
    { name: FONT_FAMILY, data: bold, weight: 700 as const },
    ...fallbackFaces,
  ];
}
