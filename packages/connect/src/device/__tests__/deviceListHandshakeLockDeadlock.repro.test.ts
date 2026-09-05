/**
 * PHASE 3 Finding 3 — minimal deterministic reproduction.
 *
 * INV-2 (liveness) + INV-5 (DeviceList consistency): a device whose handshake is
 * still QUEUED behind `DeviceList`'s global `handshakeLock` when it disconnects
 * must not stall the lock. `Device.disconnect()` removes the instance's
 * `onTransportDeviceEvent` listener, but the queued handshake closure survives;
 * when the lock reaches it, `device.run()` → `acquire()` →
 * `waitAndCompareSession` awaits a `sessionDfd` that only the (now removed)
 * listener would resolve, so it hangs forever — holding `handshakeLock` and
 * starving every later device's handshake.
 *
 * Interleaving (shrunk from `deviceListConsistency.fuzz.test.ts`, seed 1):
 *   connect '1' → connect '2' (queued behind '1') → disconnect '2' →
 *   reconnect '2' → drain.
 *
 * Pre-fix: device '1' registers, but the stale '2' instance hangs the lock, so
 * the reconnected '2' never registers (lost device) and the system never drains.
 * Post-fix (`run()`/`handshake()` bail when `disconnected`): the stale instance
 * reports not-connected, the lock is released, and the reconnected '2' registers.
 */
import { noopCreateLogger } from '@trezor/connect-common/src/utils/debug';
import { TRANSPORT } from '@trezor/transport-common';

import { Device } from '../Device';
import { DeviceList } from '../DeviceList';
import { createControllableTransport } from './support/controllableTransport';

jest.mock('../workflow/handshake', () => ({
    handshakeCancel: jest.fn(() => Promise.resolve()),
    handshake: jest.fn(() => Promise.resolve()),
}));
jest.mock('../workflow/checkFirmwareHashWithRetries', () => ({
    checkFirmwareHashWithRetries: jest.fn(() => Promise.resolve()),
}));

const flush = async () => {
    for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

describe('DeviceList handshakeLock deadlock (PHASE 3 Finding 3)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('a device disconnected while its handshake is queued does not stall the lock', async () => {
        const transport = createControllableTransport('1' as any);
        transport.disconnectPath('1' as any);

        // Reduce each handshake to acquire → release (firmware/feature middle stubbed).
        jest.spyOn(Device.prototype, 'getFeatures').mockResolvedValue(undefined as any);
        jest.spyOn(Device.prototype as any, 'checkFirmwareRevisionWithRetries').mockResolvedValue(
            undefined as any,
        );

        const deviceList = new DeviceList({
            priority: 0,
            manifest: { appName: 'repro', appUrl: 'repro' } as any,
            createLogger: noopCreateLogger,
        });
        transport.on(TRANSPORT.DEVICE_CONNECTED, (descriptor: any) => {
            (deviceList as any).onDeviceConnected(descriptor, transport);
        });

        // '1' connects and starts handshaking (holds the handshakeLock, parked on
        // acquire); '2' connects and its handshake is queued behind '1'.
        transport.connectPath('1' as any);
        await flush();
        transport.connectPath('2' as any);
        await flush();

        // '2' disconnects while still queued, then reconnects on the same path.
        transport.disconnectPath('2' as any);
        await flush();
        transport.connectPath('2' as any);
        await flush();

        // Drive every handshake to completion (bounded — a stalled lock shows up
        // as failure to drain rather than an infinite hang).
        let session = 0;
        let drained = false;
        for (let i = 0; i < 100; i++) {
            let progressed = false;
            while (transport.completeAcquire(`s${session++}`)) progressed = true;
            while (transport.completeRelease()) progressed = true;

            await flush();
            if (!progressed && !transport.hasPending()) {
                drained = true;
                break;
            }
        }

        expect(drained).toBe(true);

        const registeredPaths = deviceList.getAllDevices().map(d => (d as any).descriptor.path);
        // Reconnected '2' must be registered, and exactly once.
        expect(registeredPaths.filter(p => p === '2')).toHaveLength(1);
        expect(new Set(registeredPaths)).toEqual(new Set(['1', '2']));

        await deviceList.dispose();
    });
});
