"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadAnthropicKey, saveAnthropicKey } from "./AISetup";
import type { AIMode } from "@/lib/types";

const MODE_STORAGE = "mw_ai_mode";

interface AIContextValue {
  hasKey: boolean;
  key: string;
  setKey: (v: string) => void;
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
  const [key, setKeyState] = useState("");
  const [mode, setModeState] = useState<AIMode>("fast");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setKeyState(loadAnthropicKey());
    setModeState(loadMode());
  }, []);

  const setKey = useCallback((v: string) => {
    saveAnthropicKey(v);
    setKeyState(v.trim());
  }, []);

  const setMode = useCallback((m: AIMode) => {
    if (typeof window !== "undefined") window.localStorage.setItem(MODE_STORAGE, m);
    setModeState(m);
  }, []);

  const value = useMemo<AIContextValue>(
    () => ({
      hasKey: !!key,
      key,
      setKey,
      mode,
      setMode,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((o) => !o),
    }),
    [key, mode, isOpen, setKey, setMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAI(): AIContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAI must be used inside AIProvider");
  return v;
}
