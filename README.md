# MakerWorld Creator Stats

Interactive dashboard for your [MakerWorld](https://makerworld.com) Creator Center data.
Pull your stats for any date range, compare two periods, drill into single models.

> Unofficial. Not affiliated with MakerWorld or Bambu Lab.

It ships as **two targets that share one codebase**:

- **Chrome extension** (recommended) — a full-page dashboard that uses your **live, logged-in
  MakerWorld session**. Nothing to paste, no server, no hosting. All work happens in your
  browser and data stays in your browser.
- **Standalone web app** — clone-and-run like before. The browser still does the work and
  stores data locally (IndexedDB); a thin same-origin relay only forwards requests to
  MakerWorld to get around browser CORS. **Run it where your browser is** (the MakerWorld
  Cloudflare clearance is tied to your IP).

## What it does

- Scrapes your Creator Center analytics (impressions, views, downloads, prints, traffic
  source, points, etc.) for any date range.
- Renders an interactive dashboard: KPI strip, category breakdown, conversion charts,
  traffic-source mix, model X-ray, tags, recency-normalised performance, sortable catalogue.
- Drill into any model for a full breakdown.
- Compare against any prior period inline (Prev Period / Prev Year / Custom) with delta
  indicators and a "Biggest movers" section.
- Optional **AI Insights** drawer: paste your own Anthropic API key once and ask one-shot
  questions about your data. The call goes **directly from your browser** to
  `api.anthropic.com`; the key only ever lives in your browser's `localStorage`.

## Repository layout (Yarn workspaces)

```
packages/
  core/        shared logic: scrape parsing, aggregation, compare, AI prompts,
               ports (Fetcher/Store/AiClient), IndexedDB + Anthropic adapters
  ui/          shared React components (dashboard, sections, drawers, nav abstraction)
  web/         Next.js standalone app + thin /api/mw-proxy relay
  extension/   Chrome MV3 extension (Vite) — full-page tab
```

The two targets differ only at the edges: **how the browser reaches MakerWorld** (extension
fetches directly with host permissions; web goes through the relay) and the cookie UX.
Storage (IndexedDB) and the AI call are identical in both.

## Run the standalone web app

Requires **Node.js 20+** and **Yarn 1.x**.

```bash
git clone <your-fork-url> mw-creator-stats
cd mw-creator-stats
yarn install
yarn dev             # web target on http://localhost:3617
```

The first time, a modal asks for your MakerWorld cookie (see below). Snapshots are saved in
your browser (IndexedDB), so they persist per-browser across reloads.

### How to get your MakerWorld cookie (standalone only)

1. Log into <https://makerworld.com> and open
   <https://makerworld.com/en/my/data-overview/model>.
2. DevTools (`Cmd/Ctrl + Opt + I`) → **Application → Cookies → makerworld.com**, copy the
   `token` value — or **Network** tab → any request → copy the full `Cookie:` header.
3. Paste it into the modal and **Save**. It's kept in `localStorage` and sent only to this
   app's own `/api/mw-proxy`, which forwards it to MakerWorld. You can also set `MW_COOKIE`
   in `.env` as a fallback.

The cookie includes Cloudflare's `cf_clearance`, which is **IP-bound** — so the standalone
app must run on the same machine/network as the browser you copied it from. (The extension
sidesteps this entirely by using your live session.)

## Build & load the Chrome extension

```bash
yarn install
yarn build:ext              # outputs packages/extension/dist
```

Then in Chrome: **chrome://extensions → enable Developer mode → Load unpacked →** select
`packages/extension/dist`. Click the toolbar icon to open the full-page dashboard. Because
it runs inside your logged-in browser, there's **no cookie to paste** — just press Sync.

### AI Insights (optional, both targets)

1. Get a key from <https://console.anthropic.com/settings/keys> (start with a little credit).
2. Click **✨ Insights → set Anthropic key**, paste, **Test key**, **Save**.
3. The key is stored only in your browser's `localStorage` and used to call
   `api.anthropic.com` directly. Pick **Fast** (curated digest, cheap) or **Precise** (full
   snapshot). Each question is independent — no memory between turns.

## Publishing the extension

Everything needed for a Chrome Web Store submission lives in the repo:

- **Listing copy & review-form answers** (name, summary, description, permission
  justifications, data disclosures): [`packages/extension/STORE_LISTING.md`](packages/extension/STORE_LISTING.md).
- **Privacy policy**: [`PRIVACY.md`](PRIVACY.md) — host it (e.g. GitHub) and use its URL in the listing.
- **Icons**: generated into `packages/extension/public/icons/` (`yarn workspace @mw/extension icons`).
- **Promo graphics**: `packages/extension/store-assets/` — 440×280 tile and 1400×560 marquee
  (`yarn workspace @mw/extension assets`).
- **Screenshots**: capture real ones with the demo seeder — see
  [`store-assets/SCREENSHOTS.md`](packages/extension/store-assets/SCREENSHOTS.md). Paste
  `scripts/demo-seed.js` into the DevTools console to populate the dashboard with realistic
  data, then screenshot at 1280×800.
- **Package for upload**:
  ```bash
  yarn zip:ext   # -> packages/extension/mw-creator-stats-extension.zip
  ```

## How it works

There is no public MakerWorld analytics API, so the app talks to the same endpoints the
Creator Center UI uses:

| Step      | URL |
|-----------|-----|
| Build ID  | `GET /en/my/data-overview/model` → regex on `__NEXT_DATA__` |
| Model list| `GET /_next/data/{buildId}/.../model.json?startDate=&endDate=` |
| Per-model | `GET /_next/data/{buildId}/.../model/{id}.json` |
| Metadata  | `GET /api/v1/design-service/design/{id}` (with fallbacks) |

The `_next/data` endpoints sit behind Cloudflare's JS challenge; both targets pass it using
the `cf_clearance` cookie from your real browser session (the extension live, the standalone
via the cookie you paste). MakerWorld redeploys change the build ID and occasionally the JSON
shape; if a sync stops working, the parsing modules in `packages/core/src/scrape/` are the
place to look.

## Docker (standalone)

```bash
docker build -t mw-stats .
docker run --rm -p 3617:3617 --env-file .env mw-stats
```

No volume is needed — snapshots live in the browser, not on the server.

## License

MIT — see [LICENSE](LICENSE).
