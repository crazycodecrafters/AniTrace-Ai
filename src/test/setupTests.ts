import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-blob-url');
  window.URL.revokeObjectURL = vi.fn();
}

// In-memory localForage mock for deterministic storage tests
const inMemoryStorage: Record<string, unknown> = {};

vi.mock('localforage', () => ({
  default: {
    config: vi.fn(),
    createInstance: () => ({
      getItem: vi.fn(async (key: string) => inMemoryStorage[key] ?? null),
      setItem: vi.fn(async (key: string, value: unknown) => {
        inMemoryStorage[key] = value;
        return value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete inMemoryStorage[key];
      }),
      clear: vi.fn(async () => {
        Object.keys(inMemoryStorage).forEach((k) => delete inMemoryStorage[k]);
      }),
    }),
    getItem: vi.fn(async (key: string) => inMemoryStorage[key] ?? null),
    setItem: vi.fn(async (key: string, value: unknown) => {
      inMemoryStorage[key] = value;
      return value;
    }),
    removeItem: vi.fn(async (key: string) => {
      delete inMemoryStorage[key];
    }),
    clear: vi.fn(async () => {
      Object.keys(inMemoryStorage).forEach((k) => delete inMemoryStorage[k]);
    }),
  },
}));
