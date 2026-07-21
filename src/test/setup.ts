import "@testing-library/jest-dom/vitest";

// Node 22+ ships a global `localStorage` backed by a file that isn't
// configured in this environment, so its setItem/getItem are unusable —
// and jsdom defers to it instead of providing its own. Replace it with a
// minimal in-memory Storage so storage.ts can be tested normally.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
for (const target of [globalThis, window] as const) {
  Object.defineProperty(target, "localStorage", {
    value: memoryStorage,
    configurable: true,
  });
}
