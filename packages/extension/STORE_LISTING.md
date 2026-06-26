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

## Privacy practices tab (review form)

**Single purpose**
```
Display the signed-in user's own MakerWorld Creator Center analytics as an interactive
dashboard, entirely within the user's browser.
```

**Permission justifications**

- `storage`
```
Stores the user's fetched analytics snapshots, a metadata cache, and UI preferences locally
in the browser so data persists between sessions. No data is sent anywhere.
```

- Host permission `https://makerworld.com/*` (and `https://*.makerworld.com/*`)
```
The extension reads the signed-in user's own Creator Center analytics by calling the same
MakerWorld endpoints the website uses, authenticated by the user's existing session. This
host access is the core function of the extension.
```

- Host permission `https://api.anthropic.com/*`
```
Used only when the user opts into the AI Insights feature and provides their own Anthropic
API key. The extension sends the analytics snapshot for the user's question directly to
Anthropic. No AI request is made unless the user enables this feature.
```

- Remote code: **No.** All code is bundled in the package; nothing is loaded or executed
  from remote sources.

**Data usage / disclosures**
- Does the extension collect or use user data? **It does not collect any data on the
  developer's behalf.** Data read from MakerWorld stays in the user's browser; AI requests
  go directly to Anthropic with the user's own key.
- Not sold to third parties. Not used for purposes unrelated to the single purpose. Not used
  for creditworthiness/lending.

**Privacy policy URL**
```
https://github.com/michelem09/mw-creator-stats/blob/main/PRIVACY.md
```
(Or host PRIVACY.md via GitHub Pages and use that URL.)

---

## Graphics

- **Store icon**: `public/icons/icon-128.png` (128×128). ✓ included.
- **Screenshots** (required, 1–5; 1280×800 or 640×400): see `store-assets/SCREENSHOTS.md`.
- **Small promo tile** (440×280): `store-assets/promo-440x280.png`. ✓ generated.
- **Marquee promo** (1400×560, optional): `store-assets/promo-1400x560.png`. ✓ generated.

## Packaging

```
yarn workspace @mw/extension pack
```
produces `packages/extension/mw-creator-stats-extension.zip` (manifest at the zip root) for
upload to the Developer Dashboard.
```
