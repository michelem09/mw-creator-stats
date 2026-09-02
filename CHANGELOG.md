# Changelog

All notable changes to MakerWorld Creator Stats. The Chrome Web Store has no
per-version release-notes field, so this file is the canonical changelog.

## 0.1.4

- **Fix AI Insights (Gemini):** switch to a model that responds reliably — the
  previous one could hang forever on "thinking…".
- Clear error messages and a **Retry** button when an AI answer fails, returns
  empty, or times out (20s), so it never spins indefinitely.
- Keep the ✨ **Insights** button in the sticky toolbar on both the dashboard and
  the model-detail page, so it's always reachable while scrolling.
- **Remember the selected date range** across reloads, so your synced view no
  longer resets to "Last 30 days".
- **Model cover thumbnails** in the catalogue (with a hover preview) and on the
  model-detail page, plus a quick link to open a model on MakerWorld.
- An in-app **"What's new"** panel that shows changes once after an update.
- Show the app version in the footer.
- Internal: add a unit + integration test suite and a `release-check` gate.

## 0.1.3

- Fix the Gemini model for new API keys (internal; superseded by 0.1.4).

## 0.1.2

- **Points & Boost** view: daily reward points by source over time, with boosts
  converted to points (regular ×12, exclusive ×15), split regular vs exclusive —
  on the dashboard and per model.
- **Paginated catalogue** table with a 10/25/50/100 rows-per-page selector.
- App **logo** in the header and a **favicon** for the web version.
- Compact, single-row **Compare** control.

## 0.1.1

- Remove an unused `storage` permission from the manifest.

## 0.1.0

- Initial release: private MakerWorld Creator Center analytics that runs entirely
  in your browser — date ranges, period comparison, per-model drill-down, traffic
  sources, and optional AI Insights (bring your own API key).
