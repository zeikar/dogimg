# DOGimg

`GET /api/og?url=…` fetches a page's metadata and renders a 1200x630 Open Graph
card. The home page is the demo and the API's documentation. `README.md` covers
usage; this file covers what working on the code requires.

Next.js here is newer than most of what has been written about it. Before using
a Next API, check the docs that ship with the installed version:
`node_modules/next/dist/docs/` (`01-app/` for the App Router, `02-pages/` for the
Pages Router).

## Layout

- `src/app/api/og/route.tsx`: the endpoint. App Router, Node.js runtime, and the
  only App Router file.
- `src/pages/`, `src/components/`: the home page (Pages Router).
- `src/lib/`: everything with tests. URL guard (`target-url.js`), fetching
  (`fetch.js`), metadata (`parser.js`), card palette and title (`og-card.ts`),
  favicon and its color (`favicon.ts`, `icon-color.ts`), fonts (`og-fonts.ts`).
- `src/assets/fonts/`: Noto Sans, used by the cards and by the page.

## Checks

```bash
npm test          # node --test, no build step
npm run lint
npm run typecheck
npm run build
```

## What the code doesn't tell you

- **Every URL that came from a visitor or from a fetched page is hostile**: the
  target, its favicon, wherever a redirect lands. Request it through
  `fetchPublicUrl`, never a bare `fetch`. Favicon bytes are hostile too; the
  PNG reader in `icon-color.ts` bounds dimensions, chunk count and inflated
  size on purpose.
- **Passing tests are not enough for the route.** Verify changes under
  `src/app/api/og` with `npm run build && npx next start -p 3100` and real
  requests, and read the build output unfiltered. A missing runtime API once
  failed only when deployed, silently, because the code falls back to a
  plainer card. The `[og]` log line shows which path a request took.
- **A test that asserts on elapsed time is tied to the implementation's speed.**
  After changing code under one (the decompression-bomb test, the linear-time
  title test), remove the guard and confirm the test fails.
- **A module that another `src/lib` module imports must be `.js`.** Tests run
  on Node's type stripping, which does not rewrite `./x.js` to `./x.ts`.
- **Three places describe the API and must agree**: the code, the site copy in
  `src/components/docs.tsx` (its FAQ is also published as structured data), and
  `README.md`. Change one, check the other two.
- **After changing how cards look**, regenerate `docs/readme/example-*.png` from
  real `/api/og` responses.
- **The page takes its colors from `--hue`** (`src/styles/globals.css`), which
  follows the card on screen. `accent` is decoration only: on white it is too
  light for text or a focus ring, so those use `ink`.
- `robots.txt` must not block `/api/` (link-preview crawlers obey it and would
  lose every card) or `/_next/` (search engines need it to render the page).
