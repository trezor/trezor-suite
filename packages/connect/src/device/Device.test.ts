import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { noopCreateLogger } from '@trezor/connect-common/src/utils/debug';

import { Device } from './Device';
import { initializeFirmwareConfig } from '../data/firmwareInfo';
import * as firmwareReleaseStore from '../data/firmwareReleaseStore';
import { loadProtobufModules } from '../data/protobufLoader';
import * as settingsStore from '../data/settingsStore';

const { createTestTransport } = global.JestMocks;

// trezor protocol v1 frames: magic 3f2323 | type (2B) | length (4B) | payload
const FAILURE_ACTION_CANCELLED = Buffer.from('3f23230003000000020804', 'hex');
const FEATURES = Buffer.from('3f232300110000000c1002180020006000aa010154', 'hex');

const getAcquiredDevice = async (apiMethods: any = {}) => {
    let emitTransportEvent: (d: any[]) => void = () => {};
    const transport = createTestTransport({
        openDevice: () => {
            setTimeout(() => emitTransportEvent([{ path: '1', session: '1' }]), 100);

            return { success: true, payload: true };
        },
        on: (name: string, fn: typeof emitTransportEvent) => {
            if (name === 'transport-interface-change') {
                fn([{ path: '1', session: null }]);
                emitTransportEvent = fn;
            }
        },
        ...apiMethods,
    });

    await transport.init();
    await transport.enumerate();
    await transport.listen();

    const device = new Device({
        id: 'ABCD' as any, // any = DeviceUniquePath
        transport,
        descriptor: { path: '1' as any, type: 1, session: null, apiType: 'usb' }, // any = PathPublic
        createLogger: noopCreateLogger,
    });
    await device.acquire();

    return { transport, device };
};

// Serves scripted frames in order, then falls back to Features for any further read
const createScriptedRead = (frames: Buffer[]) => {
    let readCount = 0;

    return jest.fn(() => {
        const frame = frames[readCount] ?? FEATURES;
        readCount++;

        return Promise.resolve({ success: true, payload: frame });
    });
};

const runOptions = { skipFirmwareChecks: true, skipLanguageChecks: true };

describe('Device.run stale Cancel response recovery', () => {
    beforeAll(async () => {
        const settings = { ...parseConnectSettings({}) };
        settingsStore.set(settings);
        await firmwareReleaseStore.init(settings.firmwareChannel, true, initializeFirmwareConfig);
        await loadProtobufModules();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('recovers when GetFeatures reads a stale Failure(ActionCancelled)', async () => {
        // read 1: consumed by handshakeCancel; read 2: stale Failure hits GetFeatures;
        // read 3 (retry): Features
        const readMock = createScriptedRead([FAILURE_ACTION_CANCELLED, FAILURE_ACTION_CANCELLED]);
        const { device } = await getAcquiredDevice({ read: readMock });

        await device.run(undefined, runOptions);

        expect(device.features).toBeDefined();
        expect(readMock).toHaveBeenCalledTimes(3);
    });

    it('recovers from two stale Failures on the last allowed attempt', async () => {
        const readMock = createScriptedRead([
            FAILURE_ACTION_CANCELLED,
            FAILURE_ACTION_CANCELLED,
            FAILURE_ACTION_CANCELLED,
        ]);
        const { device } = await getAcquiredDevice({ read: readMock });

        await device.run(undefined, runOptions);

        expect(device.features).toBeDefined();
        expect(readMock).toHaveBeenCalledTimes(4);
    });

    it('rejects with Failure_ActionCancelled once the retry limit is exhausted', async () => {
        const readMock = jest.fn(() =>
            Promise.resolve({ success: true, payload: FAILURE_ACTION_CANCELLED }),
        );
        const { device } = await getAcquiredDevice({ read: readMock });

        await expect(device.run(undefined, runOptions)).rejects.toMatchObject({
            code: 'Failure_ActionCancelled',
        });
        // 1 read consumed by handshakeCancel + 3 GetFeatures attempts
        expect(readMock).toHaveBeenCalledTimes(4);
        expect(device.features).toBeUndefined();
    });

    it('does not retry when the run is interrupted', async () => {
        let readCount = 0;
        let interruptRun = () => {};
        const readMock = jest.fn(() => {
            readCount++;
            if (readCount === 1) {
                // consumed by handshakeCancel
                return Promise.resolve({ success: true, payload: FAILURE_ACTION_CANCELLED });
            }

            // interrupt the run while the GetFeatures response is a stale Failure
            interruptRun();

            return Promise.resolve({ success: true, payload: FAILURE_ACTION_CANCELLED });
        });
        const { device } = await getAcquiredDevice({ read: readMock });
        interruptRun = () => device.interrupt(new Error('user interrupt'));

        await expect(device.run(undefined, runOptions)).rejects.toThrow();

        // let any zombie retry surface before asserting
        await new Promise(resolve => setTimeout(resolve, 50));
        expect(readMock).toHaveBeenCalledTimes(2);
        expect(device.features).toBeUndefined();
    });
});
