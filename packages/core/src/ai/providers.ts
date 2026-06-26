import type { AIProviderId } from "../types";

export interface ProviderMeta {
  id: AIProviderId;
  /** Full label for the picker, e.g. "Claude (Anthropic)". */
  label: string;
  /** Short label used on answer bubbles, e.g. "Claude". */
  shortLabel: string;
  /** True for providers that have a usable no-cost tier. */
  free: boolean;
  /** Expected key prefix, used for a soft format check. Empty = no check. */
  keyPrefix: string;
  keyPlaceholder: string;
  /** Where to create a key. */
  consoleUrl: string;
  consoleLabel: string;
  /** API host shown in the privacy note. */
  host: string;
  /** One-line privacy caveat shown under the key field. */
  privacyNote: string;
}

export const PROVIDERS: Record<AIProviderId, ProviderMeta> = {
  anthropic: {
    id: "anthropic",
    label: "Claude (Anthropic)",
    shortLabel: "Claude",
    free: false,
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-api03-…",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    consoleLabel: "console.anthropic.com/settings/keys",
    host: "api.anthropic.com",
    privacyNote:
      "Paid usage (needs a small credit). Anthropic does not train on your API data.",
  },
  gemini: {
    id: "gemini",
    label: "Gemini (Google) — free",
    shortLabel: "Gemini",
    free: true,
    keyPrefix: "AIza",
    keyPlaceholder: "AIza…",
    consoleUrl: "https://aistudio.google.com/apikey",
    consoleLabel: "aistudio.google.com/apikey",
    host: "generativelanguage.googleapis.com",
    privacyNote:
      "Free tier, no credit card. Heads-up: on Google's free tier your prompts/answers may be used to improve their models.",
  },
};

export const PROVIDER_LIST: ProviderMeta[] = [PROVIDERS.anthropic, PROVIDERS.gemini];

export function providerMeta(id: AIProviderId): ProviderMeta {
  return PROVIDERS[id] ?? PROVIDERS.anthropic;
}
