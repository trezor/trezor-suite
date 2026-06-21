/**
 * PHASE 3 finding — minimal deterministic reproduction.
 *
 * INVARIANT: INV-2 (liveness — no promise hangs / no unhandled rejection escapes
 * the device layer). See `../CONCURRENCY_MODEL.md`.
 *
 * INTERLEAVING: a `run()` reaches `transport.acquire()` (acquire in-flight), then
 * an *external* client grabs the device — a `DEVICE_SESSION_CHANGED` for a
 * different session arrives before our acquire settles. `acquire()`'s
 * `waitAndCompareSession` then rejects with `SESSION_WRONG_PREVIOUS`.
 *
 * ROOT CAUSE: `Device.updateDescriptor` (the transport-event handler) did
 * `await Promise.all([this.acquirePromise, this.releasePromise])`. It only needs
 * to wait for those to *settle* before reading `sessionAcquired`, but `Promise.all`
 * re-raises the acquire rejection. `updateDescriptor` is invoked fire-and-forget
 * from `onTransportDeviceEvent`, so that rejection is unhandled (two of them here,
 * one per session-changed event that observes the still-pending acquire). The run
 * path already handles the same rejection; the event path must not re-raise it.
 *
 * FIX: `Promise.allSettled` in `updateDescriptor` (Device.ts). This test asserts
 * no `updateDescriptor` invocation rejects under the interleaving; it fails before
 * the fix (2 rejections) and passes after.
 */
import { noopCreateLogger } from '@trezor/connect-common/src/utils/debug';
import { createDeferred } from '@trezor/utils';

import { Device } from '../Device';
import { createControllableTransport } from './support/controllableTransport';

// Neutralise the firmware / handshake middle of _runInner; only queue + session
// mechanics are under test (same stubs as the fuzz harness).
jest.mock('../workflow/handshake', () => ({
    handshakeCancel: jest.fn(() => Promise.resolve()),
    handshake: jest.fn(() => Promise.resolve()),
}));
jest.mock('../workflow/checkFirmwareHashWithRetries', () => ({
    checkFirmwareHashWithRetries: jest.fn(() => Promise.resolve()),
}));

const PATH = '1' as any;
const flush = () => new Promise(resolve => setImmediate(resolve));

describe('Device session-change race (INV-2 liveness)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('does not leak an unhandled rejection when the session is taken elsewhere mid-acquire', async () => {
        const transport = createControllableTransport(PATH);
        const device = new Device({
            id: 'repro' as any,
            transport,
            descriptor: { path: PATH, type: 1, session: null, apiType: 'usb' } as any,
            createLogger: noopCreateLogger,
        });
        jest.spyOn(device, 'getFeatures').mockResolvedValue(undefined as any);
        jest.spyOn(device as any, 'initialize').mockResolvedValue(undefined as any);
        jest.spyOn(device as any, 'checkFirmwareRevisionWithRetries').mockResolvedValue(
            undefined as any,
        );

        // Capture every promise the transport-event handler (updateDescriptor)
        // returns — those are the fire-and-forget promises that would leak.
        const descriptorPromises: Promise<unknown>[] = [];
        const origUpdate = (device as any).updateDescriptor.bind(device);
        jest.spyOn(device as any, 'updateDescriptor').mockImplementation((...a: any[]) => {
            const p = origUpdate(...a);
            descriptorPromises.push(p);

            return p;
        });

        const fnDfd = createDeferred<void>();
        const runP = device.run(() => fnDfd.promise, { skipFirmwareChecks: true }).catch(() => {});

        await flush(); // _runInner reaches transport.acquire(); acquire is in-flight

        transport.setSession(PATH, 'ext0'); // external client grabs the device
        await flush();

        transport.completeAcquire('s0'); // our acquire settles with a *different* session
        await flush();
        await flush();

        // Let the run unwind cleanly.
        fnDfd.resolve();
        transport.completeRelease();
        await runP;
        await flush();

        const rejected = (await Promise.allSettled(descriptorPromises)).filter(
            r => r.status === 'rejected',
        );
        expect(rejected).toEqual([]);
    });
});
