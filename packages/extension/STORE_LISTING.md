# Chrome Web Store — listing copy & submission answers

Copy-paste these into the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
Everything is in English.

---

## Store listing

**Product name** (≤45 chars)
```
MakerWorld Creator Stats
```

**Summary / short description** (≤132 chars)
```
A private, full-page analytics dashboard for your MakerWorld Creator Center data. Runs in your browser; nothing leaves it.
```

**Category**
```
Productivity
```
(Alternative: Developer Tools.)

**Language**
```
English
```

**Detailed description**
```
MakerWorld Creator Stats turns your MakerWorld Creator Center data into an interactive,
full-page dashboard — without copying cookies, without a server, and without sending your
data anywhere. It uses your existing logged-in MakerWorld session, so you just open it and
press Sync.

Unofficial. Not affiliated with MakerWorld or Bambu Lab.

WHAT YOU GET
• KPI overview: impressions, views, downloads, prints, collects, likes, boosts, points.
• Pick any date range and compare it against the previous period or the previous year, with
  delta indicators and a "Biggest movers" view.
• Per-model drill-down: conversion funnel, traffic-source mix, age-normalised performance,
  tags, license and metadata.
• Category breakdowns, conversion charts, traffic-source analysis, recency view, and a
  sortable catalogue of all your models.
• Optional AI Insights: bring your own Anthropic API key and ask one-shot questions about
  your stats. The request goes directly from your browser to Anthropic.

PRIVACY FIRST
• No backend, no account, no tracking, no telemetry.
• Your snapshots are stored locally in your browser (IndexedDB).
• Your MakerWorld data is read using your own session and never passes through any server we
  control. The AI key (if you use it) stays in your browser and is sent only to Anthropic.

HOW IT WORKS
There is no public MakerWorld analytics API, so the dashboard reads the same endpoints the
Creator Center website uses, authenticated by your live session. MakerWorld site updates can
occasionally change the data shape; updates to the extension keep it working.
```

---

## Privacy tab (review form)

**Single purpose description**
```
Display the signed-in user's own MakerWorld Creator Center analytics as an interactive,
full-page dashboard, entirely within the user's browser. It reads the same data the Creator
Center website shows and presents date ranges, period comparisons, per-model drill-downs and
traffic-source analysis.
```

**storage justification**
```
Stores the user's fetched analytics snapshots, a metadata cache, and UI preferences (selected
date range, theme, AI provider choice) locally in the browser via IndexedDB and localStorage,
so data persists between sessions. None of this is transmitted to the developer.
```

**Host permission justification** (single combined field)
```
makerworld.com / *.makerworld.com: the extension reads the signed-in user's own Creator
Center analytics by calling the same endpoints the MakerWorld website uses, authenticated by
the user's existing browser session. This is the core function of the extension and there is
no public MakerWorld analytics API.

api.anthropic.com: used only if the user opts into the optional AI Insights feature and
selects Anthropic as the provider, with their own API key. The analytics snapshot for the
user's question is sent directly from the browser to Anthropic. No request is made unless the
user enables this feature.

The optional AI Insights feature also supports Google Gemini (the default provider). When
Gemini is selected, the request goes directly from the browser to
generativelanguage.googleapis.com as a standard CORS request with the user's own API key;
this needs no host permission, so that host is intentionally not declared in the manifest.
```

**Are you using remote code?** → **No, I am not using remote code.**
All JS is bundled in the package (fonts self-hosted, no external `<script>`, no `eval`). The
`fetch()` calls to MakerWorld/Gemini/Anthropic are data requests, not remote code.

## Data usage tab (review form)

**What user data do you plan to collect** — check only:
- ☑ **Website content** — the extension reads your MakerWorld model analytics (website
  content) and, on AI opt-in, sends a snapshot to the chosen AI provider.
- ☑ **Authentication information** — only if you use AI Insights: your AI API key is stored
  locally and sent only to the provider you selected.

Leave every other category unchecked. (Both checked categories can leave the device — to the
AI provider, only on user opt-in — so they are disclosed.)

**Certify all three disclosures** (required):
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL**
```
https://github.com/michelem09/mw-creator-stats/blob/main/PRIVACY.md
```
> ⚠️ Must be publicly reachable. The repo currently returns 404 to anonymous visitors (private
> repo) — make it public, or host PRIVACY.md elsewhere (GitHub Pages / Gist) and use that URL.

---

## Graphics

- **Store icon**: `public/icons/icon-128.png` (128×128). ✓ included.
- **Screenshots** (required, 1–5; 1280×800, no alpha): `store-assets/screenshots/*.png`. ✓
  five ready: overview, model drill-down, traffic sources, recency/catalogue, AI insights.
- **Small promo tile** (440×280, no alpha): `store-assets/promo-440x280.png`. ✓ generated.
- **Marquee promo** (1400×560, no alpha, optional): `store-assets/promo-1400x560.png`. ✓ generated.

Regenerate promos: `node scripts/gen-store-assets.mjs`. Regenerate icons: `node scripts/gen-icons.mjs`.

## Packaging

```
yarn zip:ext
```
produces `packages/extension/mw-creator-stats-extension.zip` (manifest at the zip root) for
upload to the Developer Dashboard.
```
