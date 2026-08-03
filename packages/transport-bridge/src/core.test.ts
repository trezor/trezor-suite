import { type AbstractApi, PathPublic } from '@trezor/transport-common';

import { createCore } from './core';

/**
 * Lock-safety of the node-bridge core acquire/release wrappers around
 * SessionsBackground. acquireIntent/releaseIntent take the session lock; if the
 * subsequent openDevice/closeDevice step fails, the lock must still be released,
 * otherwise the device wedges and every later acquire deadlocks.
 *
 * These run against the real SessionsBackground via a fake low-level api whose
 * openDevice result we control.
 */

const muteLogger = {
    enabled: false,
    info: () => {},
    debug: () => {},
    log: () => {},
    warn: () => {},
    error: () => {},
} as any;

// enough microtask turns to let an unblocked acquire chain reach openDevice
const flushMicrotasks = async () => {
    for (let i = 0; i < 16; i += 1) {
        await Promise.resolve();
    }
};

const createFakeApi = (override: Record<string, unknown> = {}) =>
    ({
        chunkSize: 64,
        listen: () => {},
        on: () => {},
        off: () => {},
        enumerate: () => Promise.resolve({ success: true, payload: [{ path: '1' }] }),
        openDevice: () => Promise.resolve({ success: true, payload: undefined }),
        closeDevice: () => Promise.resolve({ success: true, payload: undefined }),
        dispose: () => {},
        ...override,
    }) as unknown as AbstractApi;

describe('transport-bridge core lock safety', () => {
    it('acquire releases the session lock when openDevice fails', async () => {
        const openDevice = jest
            .fn()
            .mockResolvedValueOnce({ success: false, error: 'device disconnected during action' })
            .mockResolvedValue({ success: true, payload: undefined });

        const core = createCore(createFakeApi({ openDevice }), muteLogger);
        const { signal } = new AbortController();

        try {
            await core.enumerate({ signal });

            const first = await core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal,
                sessionOwner: 'A',
            });
            expect(first.success).toBe(false);

            // The second acquire must reach openDevice again, i.e. the lock taken by
            // the first (failed) acquireIntent was released. On the buggy code the
            // lock leaks and the second acquireIntent blocks in the queue, so
            // openDevice is never called a second time within microtasks.
            const secondPromise = core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal,
                sessionOwner: 'A',
            });
            await flushMicrotasks();
            expect(openDevice).toHaveBeenCalledTimes(2);

            const second = await secondPromise;
            expect(second.success).toBe(true);
        } finally {
            core.dispose();
        }
    });
});

/**
 * `send` (the /post handler's core call) is the only v2 path NOT wrapped in
 * `runInIsolation` (which converts throws to a structured `unknownError`). Its
 * `thpState` comes verbatim from the untrusted /post request body and is fed to
 * `ThpState.deserialize`, which throws on any malformed state. Without a guard
 * that throw escapes the promise as an unhandled rejection and crashes the
 * bridge utility process (device-communication DoS), because the http.ts /post
 * chain has no `.catch()` and the bridge thread installs no unhandledRejection
 * handler.
 */
describe('transport-bridge core send v2 robustness', () => {
    it('resolves to a structured error (not a rejection) on a malformed thpState', async () => {
        const core = createCore(createFakeApi(), muteLogger);
        const { signal } = new AbortController();

        try {
            await core.enumerate({ signal });

            const acquired = await core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal,
                sessionOwner: 'A',
            });
            expect(acquired.success).toBe(true);
            if (!acquired.success) return;

            // `{}` fails ThpState.deserialize's shape checks (expectedResponses not an array),
            // so the unguarded code would throw out of `send`. The guard must turn it into a
            // resolved { success: false } instead of a rejected promise.
            const result = await core.send({
                session: acquired.payload.session,
                data: '00',
                protocol: 'v2',
                thpState: {} as any,
                signal,
            });

            expect(result.success).toBe(false);
        } finally {
            core.dispose();
        }
    });
});
