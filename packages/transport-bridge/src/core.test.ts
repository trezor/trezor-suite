import { type AbstractApi, PathPublic, UsbApi } from '@trezor/transport-common';

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
 * usb 3.x (nusb) hands out a fresh device object per getDevices() but a stable per-connection
 * `handle`. After a fast unplug/replug the same serial path gets a NEW handle, so the tracked
 * object's OS handle is dead. The UsbApi must DROP such a device (not silently swap the fresh
 * unopened object in under the same path), so the sessions layer invalidates the now-stale session
 * and the client re-acquires. Otherwise the session keeps pointing at an unopened object and the
 * next transfer fails "endpoint not found". This exercises the real UsbApi + real SessionsBackground
 * through createCore, verifying communication through the session, not just object identity.
 */
describe('transport-bridge core: replug (changed nusb handle) invalidates the stale session', () => {
    const createUsbDevice = (serialNumber: string, handle: string) => {
        let opened = false;

        return {
            vendorId: 0x1209,
            productId: 0x53c1,
            serialNumber,
            handle,
            productName: 'Trezor',
            manufacturerName: 'Trezor',
            deviceVersionMajor: 2,
            get opened() {
                return opened;
            },
            configuration: { configurationValue: 1, interfaces: [] },
            open: () => {
                opened = true;

                return Promise.resolve();
            },
            close: () => {
                opened = false;

                return Promise.resolve();
            },
            selectConfiguration: () => Promise.resolve(),
            claimInterface: () => Promise.resolve(),
            releaseInterface: () => Promise.resolve(),
            reset: () => Promise.resolve(),
            transferIn: () =>
                Promise.resolve({ status: 'ok', data: new DataView(new Uint8Array(64).buffer) }),
            transferOut: () => Promise.resolve({ status: 'ok', bytesWritten: 64 }),
        };
    };

    it('drops the stale session on a handle change and allows a fresh re-acquire', async () => {
        let devices = [createUsbDevice('123', 'H1')];
        const usbInterface = {
            getDevices: () => Promise.resolve(devices),
            onconnect: null,
            ondisconnect: null,
        };
        const api = new UsbApi({ usbInterface: usbInterface as any });
        const core = createCore(api, muteLogger);
        const { signal } = new AbortController();

        try {
            const enum1 = await core.enumerate({ signal });
            const publicPath = enum1.success ? enum1.payload.descriptors[0]?.path : undefined;
            expect(publicPath).toBeDefined();

            const acquired = await core.acquire({
                path: publicPath!,
                previous: 'null',
                signal,
                sessionOwner: 'A',
            });
            expect(acquired.success).toBe(true);
            const session = acquired.success ? acquired.payload.session : undefined;

            // the session resolves to a path while the device is present
            const before = await core.sessionsClient.getPathBySession({ session: session! });
            expect(before.success).toBe(true);

            // fast replug: same serial, DIFFERENT handle -> the tracked handle is now dead
            devices = [createUsbDevice('123', 'H2')];
            await core.enumerate({ signal });

            // the stale session is invalidated (was kept alive by the buggy silent object swap)
            const after = await core.sessionsClient.getPathBySession({ session: session! });
            expect(after.success).toBe(false);

            // the fresh device is re-added on the next enumerate and can be acquired cleanly
            const enum3 = await core.enumerate({ signal });
            const freshPublicPath = enum3.success ? enum3.payload.descriptors[0]?.path : undefined;
            expect(freshPublicPath).toBeDefined();

            const reacquired = await core.acquire({
                path: freshPublicPath!,
                previous: 'null',
                signal,
                sessionOwner: 'A',
            });
            expect(reacquired.success).toBe(true);
        } finally {
            core.dispose();
        }
    });

    it('invalidates the stale session on a connect-before-disconnect replug via onconnect', async () => {
        let devices = [createUsbDevice('123', 'H1')];
        const usbInterface: { getDevices: () => Promise<any>; onconnect: any; ondisconnect: any } =
            {
                getDevices: () => Promise.resolve(devices),
                onconnect: null,
                ondisconnect: null,
            };
        const api = new UsbApi({ usbInterface: usbInterface as any });
        const core = createCore(api, muteLogger);
        const { signal } = new AbortController();

        try {
            const enum1 = await core.enumerate({ signal });
            const publicPath = enum1.success ? enum1.payload.descriptors[0]?.path : undefined;
            const acquired = await core.acquire({
                path: publicPath!,
                previous: 'null',
                signal,
                sessionOwner: 'A',
            });
            expect(acquired.success).toBe(true);
            const session = acquired.success ? acquired.payload.session : undefined;
            expect(
                (await core.sessionsClient.getPathBySession({ session: session! })).success,
            ).toBe(true);

            // connect-before-disconnect replug: a connect event arrives with a NEW handle while the
            // old handle is still tracked+opened (createCore wired api.listen -> usbInterface.onconnect)
            const replugged = createUsbDevice('123', 'H2');
            devices = [replugged];
            await usbInterface.onconnect({ device: replugged });

            // the stale session is invalidated by the drop (first) emit...
            expect(
                (await core.sessionsClient.getPathBySession({ session: session! })).success,
            ).toBe(false);

            // ...and the live replugged device stays visible for a fresh re-acquire
            const enum2 = await core.enumerate({ signal });
            const freshPath = enum2.success ? enum2.payload.descriptors[0]?.path : undefined;
            expect(freshPath).toBeDefined();
            const reacquired = await core.acquire({
                path: freshPath!,
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
