const storageMock: Record<string, string> = {};

export const mockLocalStorage = {
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    for (const key of Object.keys(storageMock)) {
      delete storageMock[key];
    }
  },
  get length() {
    return Object.keys(storageMock).length;
  },
  key: (index: number) => Object.keys(storageMock)[index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

(globalThis as unknown as { window: unknown }).window = {
  location: {
    pathname: '/',
    href: '',
  },
  localStorage: mockLocalStorage,
};
