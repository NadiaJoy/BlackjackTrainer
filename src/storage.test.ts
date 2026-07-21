import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./game";
import {
  appendHistory,
  loadHistory,
  loadSettings,
  saveHistory,
  saveSettings,
} from "./storage";
import type { SessionRecord } from "./types";

afterEach(() => {
  localStorage.clear();
});

const makeRecord = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
  date: "2026-01-01T00:00:00.000Z",
  countingSystem: "high-low",
  numDecks: 6,
  rounds: 10,
  correct: 8,
  total: 10,
  ...overrides,
});

describe("settings persistence", () => {
  it("falls back to defaults when nothing is stored", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips through localStorage", () => {
    const custom = { ...DEFAULT_SETTINGS, numDecks: 8, maxSplitHands: 2 };
    saveSettings(custom);
    expect(loadSettings()).toEqual(custom);
  });

  it("survives corrupted JSON by falling back to defaults", () => {
    localStorage.setItem("blackjack-trainer:settings", "{not json");
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("history persistence", () => {
  it("defaults to an empty list", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("round-trips through localStorage", () => {
    const records = [makeRecord()];
    saveHistory(records);
    expect(loadHistory()).toEqual(records);
  });

  it("ignores a non-array value in storage", () => {
    localStorage.setItem("blackjack-trainer:history", JSON.stringify({ oops: true }));
    expect(loadHistory()).toEqual([]);
  });
});

describe("appendHistory", () => {
  it("prepends the new record", () => {
    const existing = [makeRecord({ rounds: 5 })];
    const next = appendHistory(existing, makeRecord({ rounds: 9 }));
    expect(next[0].rounds).toBe(9);
    expect(next[1].rounds).toBe(5);
  });

  it("caps the list at 50 entries", () => {
    const existing = Array.from({ length: 50 }, (_, i) =>
      makeRecord({ rounds: i })
    );
    const next = appendHistory(existing, makeRecord({ rounds: 999 }));
    expect(next).toHaveLength(50);
    expect(next[0].rounds).toBe(999);
    expect(next[49].rounds).toBe(48); // oldest entry fell off the end
  });
});
