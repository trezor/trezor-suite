import {
    CORE_CALL,
    CORE_CALL_CANCEL,
    type CoreEventMessage,
    type DeviceIdentity,
    type Features,
    RESPONSE_EVENT,
} from '@trezor/connect-common';
import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import type { ConnectSettings } from '@trezor/connect-common/src/types/settings';
import { DeviceModelInternal } from '@trezor/device-utils';
import { type Deferred, createDeferred } from '@trezor/utils';

import * as firmwareInfo from '../data/firmwareInfo';
import * as firmwareReleaseStore from '../data/firmwareReleaseStore';
import { Device } from '../device/Device';

import { Core, initCoreState } from './index';

jest.mock('../data/firmwareInfo', () => {
    const actual: typeof firmwareInfo = jest.requireActual('../data/firmwareInfo');

    return {
        __esModule: true,
        ...actual,
        getRemoteFirmwareConfig: jest.fn().mockImplementation(actual.getRemoteFirmwareConfig),
    };
});

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
    const features = {
        device_id: 'device-id',
        model: 'T',
        internal_model: DeviceModelInternal.T2T1,
        major_version: 2,
        minor_version: 1,
        patch_version: 1,
        bootloader_mode: null,
        initialized: true,
        unlocked: true,
        capabilities: [],
    } as Features;
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
        // Keep Core.init offline; it falls back to the bundled firmware config.
        jest.mocked(firmwareInfo.getRemoteFirmwareConfig).mockResolvedValue(null);
        events = [];
        devices = new Map();
        handshakes = new Map();
        onDevicesChanged = () => {};
        jest.spyOn(Device.prototype, 'handshake').mockImplementation(function (this: Device) {
            devices.set(this.transportPath, this);
            jest.spyOn(this, 'features', 'get').mockReturnValue(features);

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
});
