# MakerWorld Creator Stats

Interactive dashboard for your [MakerWorld](https://makerworld.com) Creator Center data.
Pull your stats for any date range, compare two periods, drill into single models — all
running locally on your machine, fed by your authenticated browser session.

> Unofficial. Not affiliated with MakerWorld or Bambu Lab.

## What it does

- Scrapes your Creator Center analytics (impressions, views, downloads, prints, traffic source, points, etc.) for any date range.
- Caches each pull as a JSON snapshot in `./data/`.
- Renders an interactive dashboard with 7 sections: KPI strip, category breakdown,
  conversion charts, traffic source mix, model X-ray, tags, recency-normalised
  performance, and a sortable/filterable catalogue.
- Drill into any model at `/models/{id}` for full breakdown.
- Compare against any prior period inline: enable **+ Compare** in the toolbar
  (Prev Period / Prev Year / Custom). All KPIs, category cards, traffic sources
  and the catalogue table gain delta indicators, plus a dedicated "Biggest movers"
  section highlights the models that moved most.
- Optional **AI Insights** drawer: paste your own Anthropic API key once and ask
  one-shot questions about your data ("which category should I invest in?",
  "why did downloads drop?"). Toggle between *Fast* (curated ~5KB digest, cheap)
  and *Precise* (full snapshot, more accurate). The drill-down page focuses the
  bot on the single open model.

## Setup

Requires **Node.js 20+**.

```bash
git clone <your-fork-url> makerworld-creator-stats
cd makerworld-creator-stats
npm install
cp .env.example .env   # optional: set MW_COOKIE as a fallback
npm run dev
```

Open <http://localhost:3617>. The first time, a modal asks you to paste your
MakerWorld cookie.

> The default port is **3617** (not 3000) to avoid clashing with whatever else
> you might already be running locally. Override with `PORT=4000 npm run dev`.

### How to get your MakerWorld cookie

1. Log into <https://makerworld.com> in your browser.
2. Open <https://makerworld.com/en/my/data-overview/model>. You should see your
   own data.
3. Open DevTools (`Cmd/Ctrl + Opt + I`) → **Network** tab.
4. Reload the page, click any `makerworld.com` request.
5. Scroll to **Request Headers**, find the line that starts with `Cookie:`, and
   copy the full value (it's a long `name1=value1; name2=value2; …` string).
6. Paste it into the modal and press **Save**. It's stored in your browser's
   `localStorage` — never sent anywhere except this app's local API.

The cookie expires when you log out of MakerWorld; re-paste it then. If you
prefer, you can set it once in `.env` as `MW_COOKIE=…`; the UI cookie wins when
both are present.

### AI Insights (optional)

To enable the **✨ Insights** drawer:

1. Get a key from <https://console.anthropic.com/settings/keys> (start with $5 in credit).
2. Click the "✨ Insights" button in the app header, then "set Anthropic key", paste, "Test key", "Save".
3. The key is stored only in your browser&apos;s `localStorage`. The local backend
   proxies your question to `api.anthropic.com` and nothing more — no logging,
   no caching, no persistence.
4. Pick **Fast** (default, sends a ~5KB curated digest — totals, top models,
   category aggregates, movers if compare is on) or **Precise** (sends the full
   snapshot, ~60KB). Fast covers most questions and is much cheaper.

Each question is independent — the bot has **no memory** between turns. This
keeps your token cost predictable and matches how most people actually use it:
one focused question at a time.

You can also set `ANTHROPIC_API_KEY` in `.env` as a server-side fallback —
useful for `docker run` setups where you don&apos;t want users pasting keys
through the UI.

## How it works

There is no MakerWorld public API for analytics, so this app talks to the same
endpoints the Creator Center UI uses:

| Step | URL |
|---|---|
| Build ID | `GET /en/my/data-overview/model` → regex on `__NEXT_DATA__` |
| Model list | `GET /_next/data/{buildId}/.../model.json?startDate=&endDate=` |
| Per-model | `GET /_next/data/{buildId}/.../model/{id}.json` |
| Metadata | `GET /api/v1/design-service/design/{id}` (with two fallbacks) |

MakerWorld redeploys change the build ID and occasionally the JSON shape; if a
sync stops working after an MW update, the scraping modules in `lib/scrape/`
are the place to look.

## Project layout

```
app/
  page.tsx              dashboard
  models/[id]/page.tsx  drill-down
  compare/page.tsx      period comparison
  api/
    sync/route.ts       POST → SSE progress + writes snapshot
    snapshot/route.ts   GET  → cached snapshot or 404
lib/
  scrape/               TS port of the original Python scraper
  storage.ts            JSON snapshot read/write
  aggregate.ts          totals, byCategory, traffic mix
  types.ts              shared types
components/
  sections/             one file per dashboard section
data/                   gitignored, your snapshots live here
```

## Docker (optional)

```bash
docker build -t mw-stats .
docker run --rm -p 3617:3617 -v "$PWD/data:/app/data" --env-file .env mw-stats
```

## Roadmap ideas

- Multilingual UI (currently English only).
- Snapshot history / trends across runs.
- Per-day granularity for drill-down (depends on whether MakerWorld exposes it).

## License

MIT — see [LICENSE](LICENSE).
