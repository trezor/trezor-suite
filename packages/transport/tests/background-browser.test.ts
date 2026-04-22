import * as ERRORS from '../src/errors';
import { BrowserSessionsBackground } from '../src/sessions/background-browser';

type Listener = (event: { data: unknown }) => void;

class FakePort {
    listeners: Map<string, Set<Listener>> = new Map();
    postedMessages: unknown[] = [];

    addEventListener(type: string, cb: Listener) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type)!.add(cb);
    }

    removeEventListener(type: string, cb: Listener) {
        this.listeners.get(type)?.delete(cb);
    }

    postMessage(msg: unknown) {
        this.postedMessages.push(msg);
    }

    dispatch(type: string, data: unknown) {
        this.listeners.get(type)?.forEach(cb => cb({ data }));
    }

    listenerCount(type: string) {
        return this.listeners.get(type)?.size ?? 0;
    }
}

class FakeSharedWorker {
    port = new FakePort();
}

describe('BrowserSessionsBackground.handleMessage', () => {
    let originalSharedWorker: unknown;

    beforeAll(() => {
        originalSharedWorker = (global as any).SharedWorker;
        (global as any).SharedWorker = FakeSharedWorker;
    });

    afterAll(() => {
        (global as any).SharedWorker = originalSharedWorker;
    });

    const makeBackground = () => {
        const bg = new BrowserSessionsBackground('fake-url');
        const { port } = (bg as any).background as { port: FakePort };

        return { bg, port };
    };

    it('resolves with the matching response', async () => {
        const { bg, port } = makeBackground();

        const promise = bg.handleMessage({ type: 'handshake', id: 7 } as any);
        port.dispatch('message', { id: 7, success: true, payload: undefined });

        await expect(promise).resolves.toEqual({
            id: 7,
            success: true,
            payload: undefined,
        });
    });

    it('cleans up listeners once response is settled', async () => {
        const { bg, port } = makeBackground();

        const promise = bg.handleMessage({ type: 'handshake', id: 1 } as any);
        expect(port.listenerCount('message')).toBe(1);
        expect(port.listenerCount('messageerror')).toBe(1);

        port.dispatch('message', { id: 1, success: true, payload: undefined });
        await promise;

        expect(port.listenerCount('message')).toBe(0);
        expect(port.listenerCount('messageerror')).toBe(0);
    });

    it('settles with SESSION_BACKGROUND_TIMEOUT on messageerror', async () => {
        const { bg, port } = makeBackground();

        const promise = bg.handleMessage({ type: 'handshake', id: 2 } as any);
        port.dispatch('messageerror', { broken: true });

        await expect(promise).resolves.toEqual({
            success: false,
            error: { code: ERRORS.SESSION_BACKGROUND_TIMEOUT },
            id: 2,
        });
    });

    it('settles with SESSION_BACKGROUND_TIMEOUT when timeout elapses', async () => {
        jest.useFakeTimers();
        try {
            const { bg } = makeBackground();

            const promise = bg.handleMessage({ type: 'handshake', id: 3 } as any);
            jest.advanceTimersByTime(10_000);

            await expect(promise).resolves.toEqual({
                success: false,
                error: { code: ERRORS.SESSION_BACKGROUND_TIMEOUT },
                id: 3,
            });
        } finally {
            jest.useRealTimers();
        }
    });

    it('isolates concurrent requests - each receives its own response', async () => {
        const { bg, port } = makeBackground();

        const p1 = bg.handleMessage({ type: 'handshake', id: 1 } as any);
        const p2 = bg.handleMessage({ type: 'handshake', id: 2 } as any);

        expect(port.listenerCount('message')).toBe(2);
        expect(port.listenerCount('messageerror')).toBe(2);

        port.dispatch('message', { id: 2, success: true, payload: 'second' });
        port.dispatch('message', { id: 1, success: true, payload: 'first' });

        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1).toMatchObject({ id: 1, payload: 'first' });
        expect(r2).toMatchObject({ id: 2, payload: 'second' });

        expect(port.listenerCount('message')).toBe(0);
        expect(port.listenerCount('messageerror')).toBe(0);
    });
});
