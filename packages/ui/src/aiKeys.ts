// Per-provider API key storage (browser localStorage). Each provider keeps its own
// key so the user can switch between Claude and Gemini without re-pasting.
import type { AIProviderId } from "@mw/core/types";

const PROVIDER_STORAGE = "mw_ai_provider";
const LEGACY_ANTHROPIC = "mw_anthropic_key";

function keyStorage(provider: AIProviderId): string {
  return `mw_key_${provider}`;
}

/** One-time migration of the old single-provider key to the namespaced slot. */
export function migrateLegacyKeys() {
  if (typeof window === "undefined") return;
  const legacy = window.localStorage.getItem(LEGACY_ANTHROPIC);
  if (legacy && !window.localStorage.getItem(keyStorage("anthropic"))) {
    window.localStorage.setItem(keyStorage("anthropic"), legacy);
  }
}

export function loadKey(provider: AIProviderId): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(keyStorage(provider)) || "";
}

export function saveKey(provider: AIProviderId, value: string) {
  window.localStorage.setItem(keyStorage(provider), value.trim());
}

export function clearKey(provider: AIProviderId) {
  window.localStorage.removeItem(keyStorage(provider));
}

export function loadProvider(): AIProviderId {
  if (typeof window === "undefined") return "anthropic";
  const v = window.localStorage.getItem(PROVIDER_STORAGE);
  return v === "gemini" ? "gemini" : "anthropic";
}

export function saveProvider(provider: AIProviderId) {
  if (typeof window !== "undefined") window.localStorage.setItem(PROVIDER_STORAGE, provider);
}
