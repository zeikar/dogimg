# dogimg

Save the Open Graph card [DOGimg](https://dogimg.vercel.app) draws for any URL
as a 1200x630 PNG: the page's title, its icon, its color.

```bash
npx dogimg https://github.com              # saves og.png
npx dogimg https://github.com -o card.png
```

It asks `https://dogimg.vercel.app` for the card, so the page has to be public.

Exit codes:

- `0`: the card was saved.
- `1`: something went wrong, and the message says what: bad arguments, a failed
  request, an error from the API, or a file that couldn't be written. Also when
  the page couldn't be read and the saved file is a plain fallback card carrying
  only the hostname.

Requires Node.js 22 or later. To put the card in an `og:image` tag without
saving it, see the [project README](https://github.com/zeikar/dogimg#readme).

MIT licensed.
