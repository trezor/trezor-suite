import {
    CORE_CALL,
    type CoreCallMessage,
    type CoreEventMessage,
    RESPONSE_EVENT,
    UI_EVENTS,
} from '@trezor/connect-common';
import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import type { ConnectSettings } from '@trezor/connect-common/src/types/settings';
import { createDeferred } from '@trezor/utils';

import { getMethod } from './method';
import * as firmwareInfo from '../data/firmwareInfo';
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

jest.mock('../data/firmwareInfo', () => {
    const actual: typeof firmwareInfo = jest.requireActual('../data/firmwareInfo');

    return {
        __esModule: true,
        ...actual,
        getRemoteFirmwareConfig: jest.fn().mockImplementation(actual.getRemoteFirmwareConfig),
    };
});

jest.mock('./method', () => ({
    __esModule: true,
    getMethod: jest.fn(),
}));

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

describe('Core device lock events', () => {
    const DEVICE_CALL: CoreCallMessage = {
        type: CORE_CALL,
        id: '1',
        payload: { method: 'getAddress', path: "m/84'/0'/0'/0/0" },
    };

    const getLockLifecycle = (eventsSpy: jest.Mock) =>
        eventsSpy.mock.calls
            .map(([message]: [CoreEventMessage]) => message)
            .filter(
                message =>
                    message.type === UI_EVENTS.DEVICE_LOCK ||
                    message.type === UI_EVENTS.DEVICE_UNLOCK ||
                    message.event === RESPONSE_EVENT,
            )
            .map(message =>
                message.event === RESPONSE_EVENT ? `response:${message.success}` : message.type,
            );

    const flush = () => new Promise(resolve => setTimeout(resolve, 1));

    beforeEach(() => {
        // Without a remote config, Core init falls back to the bundled one instead of fetching it,
        // which these tests don't need and which would keep a network handle open past the run.
        (firmwareInfo.getRemoteFirmwareConfig as jest.Mock).mockResolvedValueOnce(null);
    });

    it('locks before initAsync and unlocks before the error response when initAsync fails', async () => {
        const initAsync = createDeferred();
        (getMethod as jest.Mock).mockResolvedValue({
            name: 'getAddress',
            useDevice: true,
            initAsync: () => initAsync.promise,
        });

        const coreManager = initCoreState();
        const eventsSpy = jest.fn();
        const core = await coreManager.getOrInit(getSettings(), eventsSpy);

        core.handleMessage(DEVICE_CALL);
        await flush();
        expect(getLockLifecycle(eventsSpy)).toEqual([UI_EVENTS.DEVICE_LOCK]);

        initAsync.reject(new Error('definitions unavailable'));
        await flush();
        expect(getLockLifecycle(eventsSpy)).toEqual([
            UI_EVENTS.DEVICE_LOCK,
            UI_EVENTS.DEVICE_UNLOCK,
            'response:false',
        ]);

        coreManager.dispose();
    });

    it('does not lock for __info of a device method', async () => {
        (getMethod as jest.Mock).mockResolvedValue({
            name: 'getAddress',
            useDevice: true,
            responseID: '1',
            getMethodInfo: () => ({}),
        });

        const coreManager = initCoreState();
        const eventsSpy = jest.fn();
        const core = await coreManager.getOrInit(getSettings(), eventsSpy);

        core.handleMessage({ ...DEVICE_CALL, payload: { ...DEVICE_CALL.payload, __info: true } });
        await flush();
        expect(getLockLifecycle(eventsSpy)).toEqual(['response:true']);

        coreManager.dispose();
    });
});
