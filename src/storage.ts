import type { Language } from "./i18n";
import { DEFAULT_SETTINGS } from "./game";
import type { GameSettings, SessionRecord } from "./types";

const SETTINGS_KEY = "blackjack-trainer:settings";
const HISTORY_KEY = "blackjack-trainer:history";
const MAX_HISTORY_ENTRIES = 50;

// localStorage may be unavailable (private browsing, etc.) — wrap every
// access in try/catch and silently fall back to defaults instead of
// crashing the app.
export const loadSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: GameSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable — just skip saving
  }
};

export const loadHistory = (): SessionRecord[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveHistory = (history: SessionRecord[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // storage unavailable — just skip saving
  }
};

export const appendHistory = (
  history: SessionRecord[],
  record: SessionRecord
): SessionRecord[] => [record, ...history].slice(0, MAX_HISTORY_ENTRIES);

export const formatSessionDate = (iso: string, language: Language): string => {
  try {
    return new Date(iso).toLocaleString(
      language === "ru" ? "ru-RU" : "en-US",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return iso;
  }
};
