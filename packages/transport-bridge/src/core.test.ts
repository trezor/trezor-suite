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
/**
 * enumerate/acquire/release are the core methods NOT wrapped in `runInIsolation`
 * (unlike call/receive) and, before this guard, not wrapped in try/catch (unlike
 * `send`). Their `api.*` device-I/O calls (the `usb` library) can throw on
 * hardware/driver errors. The http.ts /enumerate, /acquire, /release and
 * /status-data handlers float these promises with no `.catch()`, and the bridge
 * utility process installs no unhandledRejection handler, so a throw crashes the
 * whole bridge (device-communication DoS). For acquire/release a throw would also
 * skip the lock-release step and wedge the device. The core methods must resolve to
 * a structured error instead of rejecting.
 */
describe('transport-bridge core enumerate/acquire/release device-I/O robustness', () => {
    it('enumerate resolves to a structured error when api.enumerate throws', async () => {
        const core = createCore(
            createFakeApi({ enumerate: () => Promise.reject(new Error('usb enumerate boom')) }),
            muteLogger,
        );
        const { signal } = new AbortController();

        try {
            const result = await core.enumerate({ signal });
            expect(result.success).toBe(false);
        } finally {
            core.dispose();
        }
    });

    it('acquire resolves to a structured error (and releases the lock) when api.openDevice throws', async () => {
        const openDevice = jest
            .fn()
            .mockRejectedValueOnce(new Error('usb openDevice boom'))
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

            // The lock taken by the first (throwing) acquire must have been released,
            // so a second acquire reaches openDevice again instead of deadlocking.
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

    it('release resolves (and frees the lock) when api.closeDevice throws', async () => {
        const closeDevice = jest.fn().mockRejectedValue(new Error('usb closeDevice boom'));
        const core = createCore(createFakeApi({ closeDevice }), muteLogger);
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

            // release must not reject even though closeDevice throws...
            const released = await core.release({ session: acquired.payload.session });
            expect(released.success).toBe(true);

            // ...and the lock must be freed: a fresh acquire on the same path succeeds.
            const reacquired = await core.acquire({
                path: PathPublic('1'),
                previous: 'null',
                signal,
                sessionOwner: 'A',
            });
            expect(reacquired.success).toBe(true);
        } finally {
            core.dispose();
        }
    });
});

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

    it('resolves to a structured error (not a rejection) on a malformed bridge/v1 payload', async () => {
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

            // `data:'00'` is 1 byte — shorter than the 6-byte bridge header — so
            // protocolBridge.decode throws PROTOCOL_MALFORMED. The bridge/v1 tail of `send`
            // is NOT wrapped in runInIsolation (unlike call/receive) and iter21 only guarded
            // the v2 branch, so the unguarded writeUtil throw would reject and crash the bridge.
            const result = await core.send({
                session: acquired.payload.session,
                data: '00',
                protocol: 'bridge',
                signal,
            });

            expect(result.success).toBe(false);
        } finally {
            core.dispose();
        }
    });
});
