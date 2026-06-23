import React from "react";

/** Tiny markdown renderer. Handles the patterns Claude actually emits:
 *  headers (# / ## / ###), unordered (- / *) and ordered (1.) lists,
 *  paragraphs, and inline **bold**, *italic*, `code`. Anything fancier
 *  falls back to plain text — by design, no XSS risk because we never
 *  inject raw HTML. */
export function MiniMarkdown({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      const klass = level === 1 ? "h-archivo text-base font-bold mt-3 text-ink" :
                    level === 2 ? "h-archivo text-sm font-bold mt-3 text-ink" :
                                  "h-archivo text-xs font-bold mt-2 text-ink";
      out.push(
        <p key={`h${i}`} className={klass}>{renderInline(h[2])}</p>,
      );
      i++;
      continue;
    }
    if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ""));
        i++;
      }
      out.push(
        <ul key={`ul${i}`} className="list-disc pl-5 space-y-1 text-sm">
          {items.map((t, j) => <li key={j}>{renderInline(t)}</li>)}
        </ul>,
      );
      continue;
    }
    if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ""));
        i++;
      }
      out.push(
        <ol key={`ol${i}`} className="list-decimal pl-5 space-y-1 text-sm">
          {items.map((t, j) => <li key={j}>{renderInline(t)}</li>)}
        </ol>,
      );
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(
      <p key={`p${i}`} className="text-sm leading-relaxed">{renderInline(para.join(" "))}</p>,
    );
  }
  return <div className="space-y-2">{out}</div>;
}

function renderInline(s: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let k = 0;
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > lastIdx) parts.push(s.slice(lastIdx, m.index));
    if (m[2]) parts.push(<strong key={k++} className="font-bold text-ink">{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={k++}>{m[3]}</em>);
    else if (m[4]) parts.push(<code key={k++} className="rounded bg-panel2 px-1 font-mono text-[12px] text-amber">{m[4]}</code>);
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < s.length) parts.push(s.slice(lastIdx));
  return parts.length ? parts : s;
}
