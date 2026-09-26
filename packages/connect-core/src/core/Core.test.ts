import {
    CORE_CALL,
    CORE_CALL_CANCEL,
    type CoreCallMessage,
    type CoreEventMessage,
    type MethodResponseMessage,
    RESPONSE_EVENT,
} from '@trezor/connect-common';
import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import type { ConnectSettings } from '@trezor/connect-common/src/types/settings';
import { createDeferred } from '@trezor/utils';

import { AbstractMethod, type MethodReturnType } from './AbstractMethod';
import { getMethod } from './method';
import * as firmwareInfo from '../data/firmwareInfo';
import * as firmwareReleaseStore from '../data/firmwareReleaseStore';

import { type Core, initCoreState } from './index';

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

// Minimal concrete method. `run` never settles, so a call that reaches it stays in flight.
class TestMethod extends AbstractMethod<any> {
    get requiredPermissions() {
        return [];
    }

    run(): Promise<MethodReturnType<any>> {
        return new Promise(() => {});
    }
}

describe('Core cancel while initAsync is pending', () => {
    const CALL_ID = '00000000-0000-4000-8000-000000000001';

    type SendCallParams = {
        id: string;
        callId?: string;
        useDevice: boolean;
        initAsync?: () => Promise<void>;
    };

    let coreManager: ReturnType<typeof initCoreState>;
    let core: Core;
    let events: CoreEventMessage[];

    const sendCall = ({ id, callId, useDevice, initAsync }: SendCallParams) => {
        const call: CoreCallMessage = {
            type: CORE_CALL,
            id,
            payload: { method: 'getFeatures', callId },
        };
        const method = new TestMethod(call, undefined);
        method.useDevice = useDevice;
        method.initAsync = initAsync;
        jest.mocked(getMethod).mockResolvedValueOnce(method);
        core.handleMessage(call);

        return method;
    };

    const getResponses = (id: string) =>
        events.filter(
            (event): event is MethodResponseMessage =>
                event.event === RESPONSE_EVENT && event.id === id,
        );

    const cancelResponse = expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'Method_Cancel' }),
    });

    const flush = () => new Promise(resolve => setTimeout(resolve, 1));

    const startCore = async (settings = getSettings()) => {
        // Without a remote config, Core init falls back to the bundled one instead of fetching it,
        // which these tests don't need and which would keep a network handle open past the run.
        jest.mocked(firmwareInfo.getRemoteFirmwareConfig).mockResolvedValueOnce(null);
        coreManager = initCoreState();
        core = await coreManager.getOrInit(settings, event => events.push(event));
    };

    beforeEach(() => {
        events = [];
    });

    afterEach(() => {
        coreManager.dispose();
    });

    it('responds once and never reaches the device when cancelled by callId', async () => {
        await startCore();

        const definitions = createDeferred();
        const method = sendCall({
            id: '1',
            callId: CALL_ID,
            useDevice: true,
            initAsync: () => definitions.promise,
        });
        const setDevice = jest.spyOn(method, 'setDevice');
        await flush();

        core.handleMessage({ type: CORE_CALL_CANCEL, payload: { callId: CALL_ID } });
        definitions.resolve();
        await flush();

        expect(getResponses('1')).toEqual([cancelResponse]);
        expect(setDevice).not.toHaveBeenCalled();
    });

    it('responds to every in-flight call when cancelled without callId', async () => {
        await startCore();

        const definitions = createDeferred();
        sendCall({ id: '1', useDevice: false });
        const method = sendCall({ id: '2', useDevice: true, initAsync: () => definitions.promise });
        const setDevice = jest.spyOn(method, 'setDevice');
        await flush();

        core.handleMessage({ type: CORE_CALL_CANCEL, payload: {} });
        definitions.resolve();
        await flush();

        expect(getResponses('1')).toEqual([cancelResponse]);
        expect(getResponses('2')).toEqual([cancelResponse]);
        expect(setDevice).not.toHaveBeenCalled();
    });

    it('responds to a call in initAsync when cancelled without callId and no device is connected', async () => {
        await startCore(
            getSettings({
                transports: [
                    createTestTransport({
                        enumerate: () => Promise.resolve({ success: true, payload: [] }),
                    }),
                ],
            }),
        );

        const definitions = createDeferred();
        const method = sendCall({ id: '1', useDevice: true, initAsync: () => definitions.promise });
        const setDevice = jest.spyOn(method, 'setDevice');
        await flush();

        core.handleMessage({ type: CORE_CALL_CANCEL, payload: {} });
        definitions.resolve();
        await flush();

        expect(getResponses('1')).toEqual([cancelResponse]);
        expect(setDevice).not.toHaveBeenCalled();
    });

    it('does not respond with the initAsync error once a cancel has responded', async () => {
        await startCore();

        const definitions = createDeferred();
        sendCall({
            id: '1',
            callId: CALL_ID,
            useDevice: true,
            initAsync: () => definitions.promise,
        });
        await flush();

        core.handleMessage({ type: CORE_CALL_CANCEL, payload: { callId: CALL_ID } });
        definitions.reject(new Error('definitions unavailable'));
        await flush();

        expect(getResponses('1')).toEqual([cancelResponse]);
    });

    it('responds with the initAsync error when the call was not cancelled', async () => {
        await startCore();

        sendCall({
            id: '1',
            useDevice: true,
            initAsync: () => Promise.reject(new Error('definitions unavailable')),
        });
        await flush();

        expect(getResponses('1')).toEqual([
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ message: 'definitions unavailable' }),
            }),
        ]);
    });
});
