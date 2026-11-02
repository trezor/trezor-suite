/**
 * The Tor settings the desktop store keeps, with the defaults `libs/store.ts` falls back to.
 */
export const mockTorSettings = (overrides: Partial<TorSettings> = {}): TorSettings => ({
    running: false,
    host: '127.0.0.1',
    port: 9050,
    controlPort: 9051,
    torDataDir: '',
    useExternalTor: false,
    externalPort: 9150,
    ...overrides,
});
