import {
    CORE_CALL,
    type CoreCallMessage,
    type CoreEventMessage,
    UI_EVENTS,
} from '@trezor/connect-common';
import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import type { ConnectSettings } from '@trezor/connect-common/src/types/settings';

import { getMethod } from './method';
import * as firmwareReleaseStore from '../data/firmwareReleaseStore';

import { initCoreState } from './index';

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

jest.spyOn(global, 'fetch').mockImplementation(() => Promise.reject());

jest.mock('./method', () => ({
    __esModule: true,
    getMethod: jest.fn(),
}));

// import { createTestTransport } from '../device/__tests__/DeviceList.test';
const { createTestTransport } = global.JestMocks;

const getSettings = (partial: Partial<ConnectSettings> = {}) =>
    parseConnectSettings({
        transports: [createTestTransport()],
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
        // transport events emitted in next tick
        expect(eventsSpy.mock.calls).toMatchObject([[{ type: 'transport-start' }]]);

        coreManager.dispose();
    });
});

describe('Core device unlock events', () => {
    // The host locks the device UI optimistically per call; Core only emits DEVICE_UNLOCK (keyed by
    // callId) to release it — immediately for info/non-device calls, after the op for device calls.
    const CALL_ID = '00000000-0000-4000-8000-000000000000';
    const DEVICE_CALL: CoreCallMessage = {
        type: CORE_CALL,
        id: '1',
        payload: { method: 'getAddress', path: "m/84'/0'/0'/0/0", callId: CALL_ID },
    };

    const getDeviceUnlockEvents = (eventsSpy: jest.Mock) =>
        eventsSpy.mock.calls
            .map(([message]: [CoreEventMessage]) => message)
            .filter(message => message.type === UI_EVENTS.DEVICE_UNLOCK);

    const flush = () => new Promise(resolve => setTimeout(resolve, 1));

    it('releases the lock once, keyed by callId, for a device call', async () => {
        (getMethod as jest.Mock).mockResolvedValue({
            name: 'getAddress',
            useDevice: true,
            responseID: '1',
            callId: CALL_ID,
        });

        const coreManager = initCoreState();
        const eventsSpy = jest.fn();
        const core = await coreManager.getOrInit(getSettings(), eventsSpy);

        core.handleMessage(DEVICE_CALL);
        await flush();

        // No device is connected, so acquisition fails — but the device call still releases the host's
        // optimistic lock exactly once, keyed by the callId, in onCallDevice's finally.
        const unlocks = getDeviceUnlockEvents(eventsSpy);
        expect(unlocks).toHaveLength(1);
        expect(unlocks[0].payload).toMatchObject({ callId: CALL_ID });

        coreManager.dispose();
    });

    it('releases the lock for an __info probe (it never holds the device)', async () => {
        (getMethod as jest.Mock).mockResolvedValue({
            name: 'getAddress',
            useDevice: true,
            responseID: '1',
            callId: CALL_ID,
            getMethodInfo: () => ({}),
        });

        const coreManager = initCoreState();
        const eventsSpy = jest.fn();
        const core = await coreManager.getOrInit(getSettings(), eventsSpy);

        core.handleMessage({ ...DEVICE_CALL, payload: { ...DEVICE_CALL.payload, __info: true } });
        await flush();

        const unlocks = getDeviceUnlockEvents(eventsSpy);
        expect(unlocks).toHaveLength(1);
        expect(unlocks[0].payload).toMatchObject({ callId: CALL_ID });

        coreManager.dispose();
    });
});
