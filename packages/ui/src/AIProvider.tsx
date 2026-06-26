"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadKey, loadProvider, migrateLegacyKeys, saveKey, saveProvider } from "./aiKeys";
import type { AIMode, AIProviderId } from "@mw/core/types";

const MODE_STORAGE = "mw_ai_mode";

interface AIContextValue {
  provider: AIProviderId;
  /** Switch the active provider; the exposed key follows the new provider. */
  setProvider: (p: AIProviderId) => void;
  /** Active provider's key. */
  key: string;
  hasKey: boolean;
  /** Save a key for a provider and make it the active one (used by the setup modal). */
  applyKey: (provider: AIProviderId, key: string) => void;
  mode: AIMode;
  setMode: (m: AIMode) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const Ctx = createContext<AIContextValue | null>(null);

function loadMode(): AIMode {
  if (typeof window === "undefined") return "fast";
  const v = window.localStorage.getItem(MODE_STORAGE);
  return v === "precise" ? "precise" : "fast";
}

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<AIProviderId>("anthropic");
  const [key, setKeyState] = useState("");
  const [mode, setModeState] = useState<AIMode>("fast");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    migrateLegacyKeys();
    const p = loadProvider();
    setProviderState(p);
    setKeyState(loadKey(p));
    setModeState(loadMode());
  }, []);

  const setProvider = useCallback((p: AIProviderId) => {
    saveProvider(p);
    setProviderState(p);
    setKeyState(loadKey(p));
  }, []);

  const applyKey = useCallback((p: AIProviderId, v: string) => {
    saveKey(p, v);
    saveProvider(p);
    setProviderState(p);
    setKeyState(v.trim());
  }, []);

  const setMode = useCallback((m: AIMode) => {
    if (typeof window !== "undefined") window.localStorage.setItem(MODE_STORAGE, m);
    setModeState(m);
  }, []);

  const value = useMemo<AIContextValue>(
    () => ({
      provider,
      setProvider,
      key,
      hasKey: !!key,
      applyKey,
      mode,
      setMode,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((o) => !o),
    }),
    [provider, setProvider, key, applyKey, mode, setMode, isOpen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAI(): AIContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAI must be used inside AIProvider");
  return v;
}
