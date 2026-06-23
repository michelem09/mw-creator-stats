"use client";
import { useEffect } from "react";

type Variant = "info" | "error" | "warning";

const ACCENT: Record<Variant, string> = {
  info: "text-teal",
  warning: "text-amber",
  error: "text-red",
};

export interface ModalAction {
  label: string;
  onClick?: () => void;
  primary?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = "info",
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: Variant;
  actions?: ModalAction[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`h-archivo text-lg font-bold ${ACCENT[variant]}`}>{title}</h2>
        <div className="mt-3 text-sm text-ink2">{children}</div>
        <div className="mt-5 flex items-center justify-end gap-2">
          {(actions ?? [{ label: "OK", primary: true }]).map((a, i) => (
            <button
              key={i}
              onClick={() => {
                a.onClick?.();
                onClose();
              }}
              className={
                a.primary
                  ? "rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-bg"
                  : "rounded-lg px-4 py-2 text-sm text-ink2 hover:text-ink"
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
