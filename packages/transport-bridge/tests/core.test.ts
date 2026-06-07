import { AbstractApi, PathPublic } from '@trezor/transport-common';

import { createCore } from '../src/core';

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
