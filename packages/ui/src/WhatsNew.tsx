import type { ChangelogEntry } from "./changelog";

/** A one-shot "What's new" modal. Presentational only — the dashboard decides
 *  when to open it and what to show. */
export function WhatsNew({
  entries,
  onClose,
}: {
  entries: ChangelogEntry[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-panel p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="h-archivo text-lg font-bold text-ink">✨ What&apos;s new</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-ink3 hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          {entries.map((e) => (
            <div key={e.version}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber">
                v{e.version}
              </div>
              <ul className="mt-1.5 space-y-1.5">
                {e.notes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink2">
                    <span className="mt-[2px] text-teal">•</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-bg"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
