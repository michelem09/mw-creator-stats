"use client";
import { useState } from "react";
import { Modal } from "./Modal";
import { useSync } from "./SyncProvider";
import type { DateRange } from "./DateRangePicker";

interface DialogState {
  open: boolean;
  variant: "info" | "warning" | "error";
  title: string;
  body: string;
}

const CLOSED: DialogState = { open: false, variant: "info", title: "", body: "" };

export function SyncButton({
  start,
  end,
  cookie,
  compareRange,
}: {
  start: string;
  end: string;
  cookie: string;
  /** When provided, after triggering the main sync the button also kicks off a second sync for this range. */
  compareRange?: DateRange | null;
}) {
  const { jobForRange, startSync } = useSync();
  const running =
    !!jobForRange(start, end) ||
    (!!compareRange && !!jobForRange(compareRange.start, compareRange.end));
  const [dialog, setDialog] = useState<DialogState>(CLOSED);

  const showDialog = (d: Omit<DialogState, "open">) =>
    setDialog({ ...d, open: true });

  async function run() {
    if (running) return;
    if (!cookie) {
      showDialog({
        variant: "warning",
        title: "No cookie set",
        body: "Click the cookie button in the header and paste your MakerWorld cookie first.",
      });
      return;
    }
    try {
      // Fire both syncs concurrently (don't await the first before starting the
      // second) so the current and compare ranges run in parallel.
      const tasks = [startSync({ start, end }, cookie)];
      if (compareRange) tasks.push(startSync(compareRange, cookie));
      const results = await Promise.allSettled(tasks);
      const failed = results.find((r) => r.status === "rejected");
      if (failed) throw (failed as PromiseRejectedResult).reason;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isAuth = msg.startsWith("[auth]");
      showDialog({
        variant: isAuth ? "warning" : "error",
        title: isAuth ? "Cookie missing" : "Sync failed",
        body: msg.replace(/^\[auth\] /, ""),
      });
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={running}
        className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40"
      >
        {running ? "Syncing…" : compareRange ? "Sync both" : "Sync"}
      </button>

      <Modal
        open={dialog.open}
        onClose={() => setDialog(CLOSED)}
        title={dialog.title}
        variant={dialog.variant}
      >
        {dialog.body}
      </Modal>
    </div>
  );
}
