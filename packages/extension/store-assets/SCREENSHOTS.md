# Capturing store screenshots

The Chrome Web Store requires **1–5 screenshots** at **1280×800** (or 640×400), PNG or JPEG.
Real screenshots of the actual UI are expected (mockups risk rejection). You don't need live
MakerWorld data — use the bundled demo seeder.

> Ready-to-upload screenshots already live in `screenshots/` (1280×800, no alpha):
> `01-overview.png`, `02-model-drilldown.png`, `03-traffic-sources.png`,
> `04-recency-catalogue.png`, `05-ai-insights.png`. Regenerate by re-capturing at DPR 2
> (2560×1600) and downscaling 50% — see the tip at the bottom.

## Steps

1. Run the app you want to shoot:
   - Web: `yarn dev` → open <http://localhost:3617>, **or**
   - Extension: `yarn build:ext`, load `packages/extension/dist` unpacked, open the
     full-page tab.
2. Open **DevTools → Console**, paste the contents of `../scripts/demo-seed.js`, press Enter.
3. **Reload** the page — the dashboard now shows a realistic last-30-days snapshot.
4. Set the browser window so the content area is **1280×800** (e.g. DevTools device toolbar
   → Responsive → 1280×800, device pixel ratio 1), then capture.

## Suggested shots (pick 3–5)

1. **Dashboard overview** — KPI strip + category breakdown (the default view).
2. **Period comparison** — switch the compare toggle to "Prev Period" to show delta badges
   and "Biggest movers". (Run the seeder once more after picking the compare range if that
   period has no data.)
3. **Model drill-down** — click a model title → conversion funnel + traffic-source pie.
4. **Catalogue** — the sortable table of all models near the bottom.
5. **AI Insights** *(optional)* — open the ✨ Insights drawer (blur/redact the API key field).

## Tips

- Use the built-in dark theme as-is; it photographs well.
- Hide personal data if you shoot with your real account instead of the demo seeder.
- Save as PNG. Keep the same window size across shots for a consistent gallery.
