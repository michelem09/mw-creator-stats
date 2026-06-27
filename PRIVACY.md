# Privacy Policy — MakerWorld Creator Stats

_Last updated: 2026-06-27_

MakerWorld Creator Stats ("the extension") is an unofficial, client-side analytics
dashboard for your own [MakerWorld](https://makerworld.com) Creator Center data. It is not
affiliated with MakerWorld or Bambu Lab.

**Short version: the extension has no backend and collects nothing. Everything runs in your
own browser, and your data stays in your own browser.**

## What the extension does

- Reads your MakerWorld Creator Center analytics by calling the same endpoints the
  MakerWorld website uses, authenticated by **your existing logged-in session** in the
  browser. There is no separate login and nothing to paste.
- Stores the resulting snapshots and a small metadata cache **locally in your browser**
  (IndexedDB).
- Optionally, if you enable AI Insights, sends the snapshot you are viewing (or a curated
  digest of it) **directly from your browser to the AI provider you choose** — Google Gemini
  or Anthropic — using an API key that you provide.

## Data we collect

**None.** There is no server operated by the extension, no analytics, no telemetry, no
tracking, no accounts. The developer has no access to your data and cannot see it.

## Where your data lives

| Data | Stored in | Sent to |
|------|-----------|---------|
| Creator Center snapshots & metadata cache | Your browser (IndexedDB) | Nobody |
| Your AI API key (only if you use AI Insights) | Your browser (`localStorage`) | The provider you chose (Google Gemini or Anthropic), directly, as the request credential |
| The snapshot/digest for a question (only if you use AI Insights) | — | The provider you chose, directly |

Your MakerWorld data is sent only to MakerWorld's own servers (the requests that fetch it).
When you use AI Insights, the data for that question and your key are sent only to the AI
provider you selected. Nothing passes through any server owned by the extension or its
developer.

## Third-party services

- **MakerWorld** (`makerworld.com`) — your analytics are read from here using your session.
  See MakerWorld's own privacy policy for how they handle your account data.
- **Google Gemini** (`generativelanguage.googleapis.com`) — used **only if** you enable AI
  Insights and select Gemini, with **your** API key. See
  [Google's privacy policy](https://policies.google.com/privacy).
- **Anthropic** (`api.anthropic.com`) — used **only if** you enable AI Insights and select
  Anthropic, with **your** API key. See
  [Anthropic's privacy policy](https://www.anthropic.com/legal/privacy).

You choose the provider, and AI requests are made only to the one you select. If you never
enable AI Insights, no request is sent to either provider.

## Permissions and why they are needed

- **`storage`** — to keep your snapshots and settings in the browser between sessions.
- **Host access to `https://makerworld.com/*`** — to read your Creator Center analytics
  using your logged-in session.
- **Host access to `https://api.anthropic.com/*`** — only to deliver AI Insights requests
  (when you enable them and select Anthropic) directly to Anthropic with your own key.

When you select Google Gemini, requests are sent directly from your browser to
`generativelanguage.googleapis.com` as standard cross-origin requests with your own key; this
does not require a host permission. The extension does not request access to your browsing
history, tabs of other sites, or any data unrelated to MakerWorld analytics.

## Removing your data

Removing your data is entirely under your control: clear the extension's site data, remove
the extension, or clear your browser storage. Because there is no server, uninstalling the
extension and clearing browser storage removes everything.

## Changes

If this policy changes, the updated version will be published in the project repository with
a new "Last updated" date.

## Contact

Questions: open an issue in the project repository, or contact the developer via the
MakerWorld profile [@michelem](https://makerworld.com/en/@michelem).
