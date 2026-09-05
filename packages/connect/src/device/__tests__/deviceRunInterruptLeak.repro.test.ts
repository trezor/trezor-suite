/**
 * PHASE 3 finding 2 — minimal deterministic reproduction.
 *
 * INVARIANT: INV-3 (session balance — acquire/release paired; a session is only
 * held on purpose via `keepTransportSession`). See `../CONCURRENCY_MODEL.md`.
 *
 * INTERLEAVING:
 *   1. run A acquires session `s0`, runs its fn, then issues the final
 *      `release()` (release in-flight) and is awaiting it inside `_runInner`.
 *   2. run A is interrupted (here via `DEVICE_REQUEST_RELEASE` → `usedElsewhere`,
 *      an interrupt also reproduces it). The `Promise.race` abort branch settles
 *      run A's `runPromise`; its catch handler runs `release()` — a no-op because
 *      a release is already pending — and clears `runPromise`. But run A's
 *      `_runInner` is still suspended at `await this.releasePromise`.
 *   3. run B starts (allowed: `runPromise` was cleared) and parks at the very
 *      same `await this.releasePromise`.
 *   4. run B is interrupted. At abort time its `acquirePromise` is still
 *      undefined (it never reached `acquire()`), so run B's catch handler has
 *      nothing to await and releases nothing.
 *   5. the pending release finally settles. Run B's `_runInner` resumes past the
 *      park, sees `acquireNeeded` (no session held) and calls `acquire()` — for a
 *      run that was aborted in step 4. That acquire succeeds and sets
 *      `sessionAcquired`, but no one releases it: run B already settled.
 *
 * ROOT CAUSE: `_runInner` only checks `abortSignal.aborted` *after* `acquire()`.
 * A run aborted while parked *before* the acquire decision keeps running in the
 * background (it lost the `Promise.race`, it was not cancelled) and proceeds to
 * acquire a session the already-finished run can never release.
 *
 * FIX: check `abortSignal.aborted` *before* `acquire()` in `_runInner`
 * (Device.ts), so an already-aborted run bails out instead of acquiring a session
 * it will leak. This test asserts no session is held after the system drains; it
 * fails before the fix (`sessionAcquired` is a leaked session) and passes after.
 */
import { noopCreateLogger } from '@trezor/connect-common/src/utils/debug';
import { TRANSPORT } from '@trezor/transport-common';
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

describe('Device run-interrupt session leak (INV-3 session balance)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('does not leak a session when a run is interrupted while parked before acquire', async () => {
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

        // --- run A: acquire s0, run fn, then issue the final release -------------
        const fnA = createDeferred<void>();
        const runA = device.run(() => fnA.promise, { skipFirmwareChecks: true }).catch(() => {});
        await flush(); // _runInner reaches transport.acquire()

        transport.completeAcquire('s0'); // run A acquires s0
        await flush();
        fnA.resolve(); // fn finishes → _runInner reaches its final release()
        await flush();
        expect(transport.pending.some(p => p.kind === 'release')).toBe(true); // release in-flight

        // --- step 2: interrupt run A while its release is still pending ----------
        // DEVICE_REQUEST_RELEASE → usedElsewhere aborts the run; its catch's
        // release() is a no-op (release already pending) and runPromise is cleared.
        transport.emitDeviceEvent(PATH, { type: TRANSPORT.DEVICE_REQUEST_RELEASE });
        await runA;
        await flush();

        // --- step 3: run B starts and parks at `await this.releasePromise` -------
        const fnB = createDeferred<void>();
        const runB = device.run(() => fnB.promise, { skipFirmwareChecks: true }).catch(() => {});
        await flush();

        // --- step 4: interrupt run B before it ever acquires --------------------
        await device.interrupt(new Error('override-run-B'));
        await runB;
        await flush();

        // --- step 5: let the pending release settle; run B's orphaned _runInner
        // resumes and (pre-fix) acquires a leaked session ------------------------
        transport.completeRelease();
        await flush();
        transport.completeAcquire('s1'); // would-be leaked acquire for the dead run B
        await flush();
        await flush();
        // settle anything the drain raised so nothing hangs
        transport.completeRelease();
        await flush();

        // INV-3: after everything drains, no session may be held unless the device
        // is deliberately keeping it (keepTransportSession). A leaked acquire from
        // the aborted run B shows up here as a non-null sessionAcquired.
        const held = (device as any).sessionAcquired;
        const keep = (device as any).keepTransportSession;
        expect({ held, keep }).toEqual({ held: null, keep: false });
    });
});
