import {
    CORE_CALL,
    CORE_CALL_CANCEL,
    type CoreEventMessage,
    type DeviceIdentity,
    RESPONSE_EVENT,
} from '@trezor/connect-common';
import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import type { ConnectSettings } from '@trezor/connect-common/src/types/settings';
import { type Deferred, createDeferred } from '@trezor/utils';

import { onCallFirmwareUpdate } from './onCallFirmwareUpdate';
import * as firmwareReleaseStore from '../data/firmwareReleaseStore';
import { Device } from '../device/Device';

import { Core, initCoreState } from './index';

jest.mock('./onCallFirmwareUpdate', () => ({ onCallFirmwareUpdate: jest.fn() }));

// `import * as` against a CJS-transpiled module gives non-configurable property
// bindings, so jest.spyOn cannot replace `init` directly. Wrap it in a jest.fn
// at the module level; the default delegates to the real implementation, and
// individual tests can `mockImplementationOnce` to override behavior for one call.
jest.mock('../data/firmwareReleaseStore', () => {
    const actual: typeof firmwareReleaseStore = jest.requireActual('../data/firmwareReleaseStore');

    return {
        __esModule: true,
        ...actual,
        init: jest.fn().mockImplementation(actual.init),
    };
});

// import { createTestTransport } from '../device/__tests__/DeviceList.test';
const { createTestTransport } = global.JestMocks;

const getSettings = (partial: Partial<ConnectSettings> = {}) =>
    parseConnectSettings({
        transports: [createTestTransport()],
        transportReconnect: false,
        ...partial,
    });

describe('Core', () => {
    beforeAll(async () => {});

    it('getOrInit throws error on firmware release init', async () => {
        (firmwareReleaseStore.init as jest.Mock).mockImplementationOnce(() => {
            throw new Error('firmware release init error');
        });

        const coreManager = initCoreState();
        await expect(coreManager.getOrInit(getSettings(), jest.fn())).rejects.toThrow(
            'firmware release init error',
        );
    });

    it('getOrInit throws error when disposed before initialization', async () => {
        const coreManager = initCoreState();
        const promise = coreManager.getOrInit(getSettings(), jest.fn());
        coreManager.dispose();
        await expect(promise).rejects.toThrow('Disposed during initialization');
    });

    it('calling getOrInit multiple times synchronously', async () => {
        const coreManager = initCoreState();
        const settings = getSettings();
        const [c1, c2] = await Promise.all([
            coreManager.getOrInit(settings, jest.fn()),
            coreManager.getOrInit(settings, jest.fn()),
        ]);

        // the same instance
        expect(c1).toEqual(c2);
        coreManager.dispose();
    });

    it('successful getOrInit', async () => {
        const coreManager = initCoreState();
        const eventsSpy = jest.fn();
        await coreManager.getOrInit(getSettings(), eventsSpy);
        // no events emitted before initialization
        expect(eventsSpy).toHaveBeenCalledTimes(0);
        await new Promise(resolve => setTimeout(resolve, 1));
        // device + transport events emitted in next tick
        expect(eventsSpy).toHaveBeenCalledTimes(2);

        coreManager.dispose();
    });
});

describe('Core calls during device handshakes', () => {
    const callId = '5c38d126-e813-4e5b-9f7c-938d60804497';
    let core: Core;
    let events: CoreEventMessage[];
    let devices: Map<string, Device>;
    let handshakes: Map<string, Deferred<void>>;
    let onDevicesChanged: (descriptors: { path: string }[]) => void;
    let runSpy: jest.SpyInstance;

    const getDevice = (path: string) => {
        const device = devices.get(path);
        if (!device) throw new Error(`Test device ${path} was not enumerated`);

        return device;
    };

    const connectDevices = async (...paths: string[]) => {
        onDevicesChanged(paths.map(path => ({ path })));
        await jest.advanceTimersByTimeAsync(1000);
    };

    const callGetFeatures = async (device?: DeviceIdentity) => {
        core.handleMessage({
            type: CORE_CALL,
            id: 'test-call',
            payload: {
                method: 'getFeatures',
                callId,
                device,
            },
        });
        await jest.advanceTimersByTimeAsync(0);
    };

    const getResponses = () => events.filter(event => event.event === RESPONSE_EVENT);

    beforeEach(async () => {
        jest.useFakeTimers();
        const actual: typeof firmwareReleaseStore = jest.requireActual(
            '../data/firmwareReleaseStore',
        );
        jest.mocked(firmwareReleaseStore.init).mockImplementationOnce(
            (firmwareChannel, _onlyLocal, initializeFirmwareConfig) =>
                actual.init(firmwareChannel, true, initializeFirmwareConfig),
        );
        events = [];
        devices = new Map();
        handshakes = new Map();
        onDevicesChanged = () => {};
        jest.spyOn(Device.prototype, 'handshake').mockImplementation(function (this: Device) {
            devices.set(this.transportPath, this);
            jest.spyOn(this, 'features', 'get').mockReturnValue(
                global.JestMocks.getDeviceFeatures(),
            );

            return (
                handshakes.get(this.transportPath)?.promise.then(() => true) ??
                Promise.resolve(true)
            );
        });
        runSpy = jest.spyOn(Device.prototype, 'run').mockImplementation(async action => {
            await action?.();
        });
        const transport = createTestTransport({
            enumerate: () => ({ success: true, payload: [] }),
            on: (event: string, callback: typeof onDevicesChanged) => {
                if (event === 'transport-interface-change') onDevicesChanged = callback;
            },
        });
        core = new Core();
        await core.init(getSettings({ transports: [transport] }), event => events.push(event));
        await jest.advanceTimersByTimeAsync(0);
    });

    afterEach(async () => {
        core.dispose();
        handshakes.forEach(handshake => handshake.resolve());
        await jest.advanceTimersByTimeAsync(0);
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it.each(['path', 'state'] as const)(
        'calls a ready device selected by %s while another device is handshaking',
        async identity => {
            await connectDevices('1');
            handshakes.set('2', createDeferred());
            await connectDevices('1', '2');

            await callGetFeatures(
                identity === 'path'
                    ? { path: getDevice('1').getUniquePath() }
                    : { state: { staticSessionId: 'test@device-id:0' } },
            );

            expect(getResponses()).toEqual([expect.objectContaining({ success: true })]);
            expect(runSpy).toHaveBeenCalledTimes(1);
        },
    );

    it('waits for the requested device instead of falling back to a ready device', async () => {
        await connectDevices('1');
        const handshake = createDeferred();
        handshakes.set('2', handshake);
        await connectDevices('1', '2');

        await callGetFeatures({ path: getDevice('2').getUniquePath() });
        expect(runSpy).not.toHaveBeenCalled();
        handshake.resolve();
        await jest.advanceTimersByTimeAsync(0);

        expect(getResponses()).toEqual([expect.objectContaining({ success: true })]);
        expect(runSpy.mock.instances).toEqual([getDevice('2')]);
    });

    it('waits for a handshake before selecting the only device', async () => {
        const handshake = createDeferred();
        handshakes.set('1', handshake);
        await connectDevices('1');
        await callGetFeatures();
        expect(getResponses()).toHaveLength(0);

        handshake.resolve();
        await jest.advanceTimersByTimeAsync(0);

        expect(getResponses()).toEqual([expect.objectContaining({ success: true })]);
    });

    it.each(['scoped', 'all'] as const)('cancels a waiting call (%s)', async scope => {
        const handshake = createDeferred();
        handshakes.set('1', handshake);
        await connectDevices('1');
        await callGetFeatures();

        core.handleMessage({
            type: CORE_CALL_CANCEL,
            payload: scope === 'scoped' ? { callId } : null,
        });
        await jest.advanceTimersByTimeAsync(0);
        expect(getResponses()).toEqual([
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: 'Method_Cancel' }),
            }),
        ]);

        handshake.resolve();
        await jest.advanceTimersByTimeAsync(30001);

        expect(runSpy).not.toHaveBeenCalled();
        expect(getResponses()).toHaveLength(1);
    });

    it('does not respond again when a cancelled handshake times out', async () => {
        handshakes.set('1', createDeferred());
        await connectDevices('1');
        await callGetFeatures();
        core.handleMessage({ type: CORE_CALL_CANCEL, payload: { callId } });

        await jest.advanceTimersByTimeAsync(30001);

        expect(getResponses()).toHaveLength(1);
        expect(runSpy).not.toHaveBeenCalled();
    });

    it('keeps another waiting call alive when cancelling by callId', async () => {
        const handshake = createDeferred();
        handshakes.set('1', handshake);
        await connectDevices('1');
        await callGetFeatures();
        core.handleMessage({
            type: CORE_CALL,
            id: 'other-call',
            payload: { method: 'getFeatures' },
        });
        await jest.advanceTimersByTimeAsync(0);

        core.handleMessage({ type: CORE_CALL_CANCEL, payload: { callId } });
        await jest.advanceTimersByTimeAsync(0);
        handshake.resolve();
        await jest.advanceTimersByTimeAsync(0);

        expect(getResponses()).toEqual([
            expect.objectContaining({
                id: 'test-call',
                success: false,
                error: expect.objectContaining({ code: 'Method_Cancel' }),
            }),
            expect.objectContaining({ id: 'other-call', success: true }),
        ]);
        expect(runSpy).toHaveBeenCalledTimes(1);
    });

    it('does not resume a call after Core is disposed', async () => {
        const handshake = createDeferred();
        handshakes.set('1', handshake);
        await connectDevices('1');
        await callGetFeatures();

        core.dispose();
        handshake.resolve();
        await jest.advanceTimersByTimeAsync(30001);

        expect(runSpy).not.toHaveBeenCalled();
        expect(getResponses()).toHaveLength(0);
    });

    it('reports a handshake timeout for a device that never becomes ready', async () => {
        handshakes.set('1', createDeferred());
        await connectDevices('1');
        await callGetFeatures();

        await jest.advanceTimersByTimeAsync(30001);

        expect(getResponses()).toEqual([
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: 'Device_InitializeInProgress' }),
            }),
        ]);
        expect(runSpy).not.toHaveBeenCalled();
    });

    describe('firmwareUpdate', () => {
        const callFirmwareUpdate = async (device?: DeviceIdentity) => {
            core.handleMessage({
                type: CORE_CALL,
                id: 'firmware-call',
                payload: { method: 'firmwareUpdate', callId, device },
            });
            await jest.advanceTimersByTimeAsync(0);
        };

        beforeEach(() => {
            jest.mocked(onCallFirmwareUpdate)
                .mockReset()
                .mockImplementation(({ params, context }) => {
                    // Exercise selection, but stop before downloading or flashing firmware.
                    context.selectDevice(params.device?.path);

                    return Promise.resolve({
                        versionCheck: true,
                        bootloaderVersion: [2, 1, 0],
                        installedVersion: [2, 9, 0],
                        binaryVersion: [2, 9, 0],
                    });
                });
        });

        it.each(['complete', 'cancel'] as const)(
            'waits for initial transport enumeration (%s)',
            async outcome => {
                core.dispose();
                const enumeration = createDeferred<{
                    success: true;
                    payload: { path: string }[];
                }>();
                const actual: typeof firmwareReleaseStore = jest.requireActual(
                    '../data/firmwareReleaseStore',
                );
                jest.mocked(firmwareReleaseStore.init).mockImplementationOnce(
                    (channel, _onlyLocal, initialize) => actual.init(channel, true, initialize),
                );
                core = new Core();
                await core.init(
                    getSettings({
                        transports: [createTestTransport({ enumerate: () => enumeration.promise })],
                        transportReconnect: true,
                    }),
                    event => events.push(event),
                );

                try {
                    await callFirmwareUpdate();
                    expect(onCallFirmwareUpdate).not.toHaveBeenCalled();
                    expect(getResponses()).toHaveLength(0);
                    if (outcome === 'cancel') {
                        core.handleMessage({ type: CORE_CALL_CANCEL, payload: { callId } });
                        await jest.advanceTimersByTimeAsync(0);
                        expect(getResponses()).toEqual([
                            expect.objectContaining({
                                success: false,
                                error: expect.objectContaining({ code: 'Method_Cancel' }),
                            }),
                        ]);
                    }
                } finally {
                    enumeration.resolve({ success: true, payload: [{ path: '1' }] });
                    await jest.advanceTimersByTimeAsync(1000);
                }

                if (outcome === 'complete') {
                    expect(onCallFirmwareUpdate).toHaveBeenCalledTimes(1);
                    expect(getResponses()).toEqual([expect.objectContaining({ success: true })]);
                } else {
                    expect(onCallFirmwareUpdate).not.toHaveBeenCalled();
                    expect(getResponses()).toHaveLength(1);
                }
            },
        );

        it('waits for the requested device handshake', async () => {
            const handshake = createDeferred();
            handshakes.set('1', handshake);
            await connectDevices('1');
            await callFirmwareUpdate({ path: getDevice('1').getUniquePath() });
            expect(onCallFirmwareUpdate).not.toHaveBeenCalled();
            expect(getResponses()).toHaveLength(0);

            handshake.resolve();
            await jest.advanceTimersByTimeAsync(0);

            expect(onCallFirmwareUpdate).toHaveBeenCalledTimes(1);
            expect(getResponses()).toEqual([expect.objectContaining({ success: true })]);
        });

        it('does not block an explicitly selected ready device on another handshake', async () => {
            await connectDevices('1');
            handshakes.set('2', createDeferred());
            await connectDevices('1', '2');
            await callFirmwareUpdate({ path: getDevice('1').getUniquePath() });

            expect(onCallFirmwareUpdate).toHaveBeenCalledTimes(1);
            expect(getResponses()).toEqual([expect.objectContaining({ success: true })]);
        });

        it.each(['scoped', 'all'] as const)(
            'cancels before starting the update (%s)',
            async scope => {
                const handshake = createDeferred();
                handshakes.set('1', handshake);
                await connectDevices('1');
                await callFirmwareUpdate();
                core.handleMessage({
                    type: CORE_CALL_CANCEL,
                    payload: scope === 'scoped' ? { callId } : null,
                });
                await jest.advanceTimersByTimeAsync(0);

                expect(getResponses()).toEqual([
                    expect.objectContaining({
                        success: false,
                        error: expect.objectContaining({ code: 'Method_Cancel' }),
                    }),
                ]);
                handshake.resolve();
                await jest.advanceTimersByTimeAsync(30001);

                expect(onCallFirmwareUpdate).not.toHaveBeenCalled();
                expect(getResponses()).toHaveLength(1);
            },
        );

        it('does not resume the update after disposal', async () => {
            const handshake = createDeferred();
            handshakes.set('1', handshake);
            await connectDevices('1');
            await callFirmwareUpdate();
            core.dispose();
            handshake.resolve();
            await jest.advanceTimersByTimeAsync(30001);

            expect(onCallFirmwareUpdate).not.toHaveBeenCalled();
            expect(getResponses()).toHaveLength(0);
        });

        it('keeps another waiting call alive when cancelling the update by callId', async () => {
            const handshake = createDeferred();
            handshakes.set('1', handshake);
            await connectDevices('1');
            await callFirmwareUpdate();
            core.handleMessage({
                type: CORE_CALL,
                id: 'other-call',
                payload: { method: 'getFeatures' },
            });
            await jest.advanceTimersByTimeAsync(0);

            core.handleMessage({ type: CORE_CALL_CANCEL, payload: { callId } });
            await jest.advanceTimersByTimeAsync(0);
            handshake.resolve();
            await jest.advanceTimersByTimeAsync(0);

            expect(getResponses()).toEqual([
                expect.objectContaining({
                    id: 'firmware-call',
                    success: false,
                    error: expect.objectContaining({ code: 'Method_Cancel' }),
                }),
                expect.objectContaining({ id: 'other-call', success: true }),
            ]);
            expect(onCallFirmwareUpdate).not.toHaveBeenCalled();
            expect(runSpy).toHaveBeenCalledTimes(1);
        });

        it('reports a handshake timeout without starting the update', async () => {
            handshakes.set('1', createDeferred());
            await connectDevices('1');
            await callFirmwareUpdate();
            await jest.advanceTimersByTimeAsync(30001);

            expect(getResponses()).toEqual([
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({ code: 'Device_InitializeInProgress' }),
                }),
            ]);
            expect(onCallFirmwareUpdate).not.toHaveBeenCalled();
        });
    });
});
