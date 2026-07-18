import { CoreInSuiteDesktop } from '../core-in-suite-desktop';

// Control which ports "refuse" the connection and inspect the clients that were built.
// (jest hoists jest.mock above these, so out-of-scope names must be `mock`-prefixed.)
const mockBlockedPorts = new Set<number>();
const mockInstances: { url: string; connected: boolean; disposed: boolean }[] = [];

jest.mock('@trezor/websocket-client', () => {
    class WebsocketError extends Error {}

    class WebsocketClient {
        options: { url: string };
        private connected = false;
        private record: { url: string; connected: boolean; disposed: boolean };

        constructor(options: { url: string }) {
            this.options = options;
            this.record = { url: options.url, connected: false, disposed: false };
            mockInstances.push(this.record);
        }

        connect() {
            const port = Number(new URL(this.options.url).port);
            if (mockBlockedPorts.has(port)) {
                return Promise.reject(new WebsocketError(`ECONNREFUSED ${port}`));
            }
            this.connected = true;
            this.record.connected = true;

            return Promise.resolve();
        }

        isConnected() {
            return this.connected;
        }

        dispose() {
            this.connected = false;
            this.record.disposed = true;
        }
    }

    return { __esModule: true, WebsocketClient, WebsocketError };
});

const portOf = (url: string) => Number(new URL(url).port);

describe('CoreInSuiteDesktop connect-ws port fallback', () => {
    beforeEach(() => {
        mockBlockedPorts.clear();
        mockInstances.length = 0;
    });

    it('connects to the default port 21335 when it is free', async () => {
        const core = new CoreInSuiteDesktop();
        await (core as any).connect();

        expect(portOf((core as any).ws.options.url)).toBe(21335);
        // Only the client the constructor built is used; no fallback clients are created.
        expect(mockInstances).toHaveLength(1);
    });

    it('falls back to the next free port when earlier ones are occupied', async () => {
        mockBlockedPorts.add(21335);
        mockBlockedPorts.add(21336);

        const core = new CoreInSuiteDesktop();
        await (core as any).connect();

        expect(portOf((core as any).ws.options.url)).toBe(21337);
        // Probed 21335, 21336, 21337 in order; the occupied fallback client was disposed.
        expect(mockInstances.map(i => portOf(i.url))).toEqual([21335, 21336, 21337]);
        expect(mockInstances.find(i => portOf(i.url) === 21336)?.disposed).toBe(true);
    });

    it('rejects when every fallback port is occupied', async () => {
        [21335, 21336, 21337, 21338, 21339].forEach(port => mockBlockedPorts.add(port));

        const core = new CoreInSuiteDesktop();

        await expect((core as any).connect()).rejects.toThrow();
        expect(mockInstances.map(i => portOf(i.url))).toEqual([21335, 21336, 21337, 21338, 21339]);
        expect((core as any).ws.isConnected()).toBe(false);
    });
});
