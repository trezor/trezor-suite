import { combineReducers } from '@reduxjs/toolkit';

import { mock, mockNotExpected } from '@suite-common/dependency-injection';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { type LockDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import TrezorConnect, { type CallMethodAnyResponse, type CallMethodParams } from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { getSynchronize } from '@trezor/utils';

import { connectPopupActions } from './connectPopupActions';
import {
    createPopupCallDeferred,
    getPermissionDeferred,
    queuePopupCall,
} from './connectPopupPromiseManager';
import { prepareConnectPopupReducer } from './connectPopupReducer';
import {
    type ConnectPopupCallThunkDeps,
    type ConnectPopupCallThunkState,
    connectPopupCallInnerThunk,
    connectPopupCallThunk,
    connectPopupCancelThunk,
    connectPopupDeeplinkThunk,
    connectPopupVerifyAddressThunk,
} from './connectPopupThunks';
import {
    type AppRememberedPermission,
    CALL_SOURCE_DEEPLINK,
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_MCP,
    CALL_SOURCE_WEB,
    type ConnectCallSource,
    UNKNOWN_PROCESS,
} from './connectPopupTypes';
import type { DistributiveOmit } from './methodHooks/types';

type DeviceResponse = Awaited<CallMethodAnyResponse>;

const device = mockSuiteDevice({
    connected: true,
    path: '1',
    instance: 0,
    useEmptyPassphrase: true,
});
const deviceState: DeviceReducerState = { ...deviceInitialState, selectedDevice: device };

const createStore = (permissions: AppRememberedPermission[] = []) =>
    createTestCompositionRoot<ConnectPopupCallThunkDeps, ConnectPopupCallThunkState>({
        services: () => ({
            analytics: {
                init: mockNotExpected('init'),
                enable: mockNotExpected('enable'),
                disable: mockNotExpected('disable'),
                isEnabled: mockNotExpected('isEnabled'),
                setUrl: mockNotExpected('setUrl'),
                setLoggerEnabled: mockNotExpected('setLoggerEnabled'),
                report: mock(),
            },
            lockDevice: mock<LockDevice>(),
        }),
        reducer: combineReducers({
            connectPopup: prepareConnectPopupReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
            device: (state: DeviceReducerState = deviceState) => state,
        }),
        preloadedState: {
            connectPopup: { activeCall: undefined, permissions },
            device: deviceState,
        },
    }).services.store;

type Store = ReturnType<typeof createStore>;

const waitFor = async (condition: () => boolean) => {
    for (let i = 0; i < 50 && !condition(); i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    expect(condition()).toBe(true);
};

const flush = async () => {
    for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
};

const track = <T>(promise: Promise<T>) => {
    const tracked: { value?: T } = {};
    promise.then(value => {
        tracked.value = value;
    });

    return tracked;
};

const source: ConnectCallSource = {
    type: CALL_SOURCE_WEB,
    origin: 'https://example.com',
    manifest: { appName: 'Test app' },
};

const interrupted = expect.objectContaining({
    success: false,
    error: expect.objectContaining({ code: 'Method_Interrupted' }),
});

const deeplinkUrl = (message: string, callback: string) =>
    `https://connect.trezor.io/9/deeplink/1/?method=signMessage&params=${encodeURIComponent(
        JSON.stringify({ path: "m/84'/0'/0'/0/0", message }),
    )}&callback=${encodeURIComponent(callback)}`;

// The callback URLs Suite opened so far, each with the response it carries.
const getDeeplinkCallbacks = (store: Store) =>
    store
        .getActions()
        .filter(connectPopupActions.deeplinkCallback.match)
        .map(({ payload }) => {
            const url = new URL(payload.callbackUrl);

            return {
                origin: url.origin,
                response: JSON.parse(url.searchParams.get('response') ?? 'null'),
            };
        });

const approveWhenAsked = async (store: Store) => {
    await waitFor(() => store.getState().connectPopup.activeCall?.state === 'permission-request');
    store.dispatch(connectPopupActions.approvePermissions());
};

describe('connectPopupCallThunk responses', () => {
    // Device calls wait here until the test answers them, one at a time like the device does.
    let deviceCalls: { message: string; respond: (response: DeviceResponse) => void }[];

    const answerDeviceCall = async (message: string, response: DeviceResponse) => {
        await waitFor(() => deviceCalls.length > 0);
        const [deviceCall] = deviceCalls.splice(0, 1);
        expect(deviceCall?.message).toBe(message);
        deviceCall?.respond(response);
    };

    const signature = (value: string): DeviceResponse => ({
        success: true,
        payload: { address: 'address', signature: value },
    });

    beforeEach(() => {
        deviceCalls = [];
        // Suite runs every Connect call through one queue, so a call waits for the one before it.
        const synchronize = getSynchronize();
        jest.spyOn(TrezorConnect, 'call').mockImplementation(params =>
            synchronize(() =>
                '__info' in params
                    ? Promise.resolve({
                          success: true,
                          payload: { info: 'Sign message', requiredPermissions: [], useUi: true },
                      } as DeviceResponse)
                    : new Promise<DeviceResponse>(respond => {
                          deviceCalls.push({
                              message: (params as { message: string }).message,
                              respond,
                          });
                      }),
            ),
        );
        jest.spyOn(TrezorConnect, 'cancel').mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it('sends each deeplink caller the response of its own call', async () => {
        const store = createStore();

        store.dispatch(
            connectPopupDeeplinkThunk({ url: deeplinkUrl('first', 'https://first.example/cb') }),
        );
        await approveWhenAsked(store);
        await waitFor(() => deviceCalls.length > 0);
        store.dispatch(
            connectPopupDeeplinkThunk({ url: deeplinkUrl('second', 'https://second.example/cb') }),
        );

        await answerDeviceCall('first', signature('signature-first'));
        await approveWhenAsked(store);
        await answerDeviceCall('second', signature('signature-second'));
        await flush();

        expect(getDeeplinkCallbacks(store)).toEqual([
            {
                origin: 'https://first.example',
                response: expect.objectContaining({
                    payload: expect.objectContaining({ signature: 'signature-first' }),
                }),
            },
            {
                origin: 'https://second.example',
                response: expect.objectContaining({
                    payload: expect.objectContaining({ signature: 'signature-second' }),
                }),
            },
        ]);
    });

    it('does not pass the late result of a canceled call to the next call', async () => {
        const store = createStore();

        store.dispatch(
            connectPopupDeeplinkThunk({ url: deeplinkUrl('first', 'https://first.example/cb') }),
        );
        await approveWhenAsked(store);
        await waitFor(() => deviceCalls.length > 0);
        store.dispatch(connectPopupCancelThunk({}));
        await waitFor(() => getDeeplinkCallbacks(store).length === 1);
        store.dispatch(
            connectPopupDeeplinkThunk({ url: deeplinkUrl('second', 'https://second.example/cb') }),
        );

        await answerDeviceCall('first', signature('signature-first'));
        await approveWhenAsked(store);
        await answerDeviceCall('second', signature('signature-second'));
        await flush();

        expect(getDeeplinkCallbacks(store)).toEqual([
            {
                origin: 'https://first.example',
                response: expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({ code: 'Method_Interrupted' }),
                }),
            },
            {
                origin: 'https://second.example',
                response: expect.objectContaining({
                    payload: expect.objectContaining({ signature: 'signature-second' }),
                }),
            },
        ]);
    });

    it('sends the response of a retried call to the caller of the original call', async () => {
        const store = createStore();

        store.dispatch(
            connectPopupDeeplinkThunk({ url: deeplinkUrl('first', 'https://first.example/cb') }),
        );
        await approveWhenAsked(store);
        await answerDeviceCall('first', {
            success: false,
            error: serializeError(TypedError('Device_Disconnected')),
        });
        await waitFor(() => store.getState().connectPopup.activeCall?.state === 'call-error');

        const failedCall = store.getState().connectPopup.activeCall;
        if (failedCall?.state === 'call-error') {
            store.dispatch(connectPopupCallInnerThunk({ ...failedCall }));
        }
        await approveWhenAsked(store);
        await answerDeviceCall('first', signature('signature-first'));
        await flush();

        expect(getDeeplinkCallbacks(store)).toEqual([
            {
                origin: 'https://first.example',
                response: expect.objectContaining({
                    payload: expect.objectContaining({ signature: 'signature-first' }),
                }),
            },
        ]);
    });

    it('answers a call that ended with a device error when it is canceled, so queued calls can start', async () => {
        const store = createStore();
        const first = await queuePopupCall();
        const firstResponse = track(first.promise);
        store.dispatch(
            connectPopupCallThunk({
                method: 'signMessage',
                payload: { path: "m/84'/0'/0'/0/0", message: 'first' },
                source,
                responseId: first.id,
            }),
        );
        await approveWhenAsked(store);
        await answerDeviceCall('first', {
            success: false,
            error: serializeError(TypedError('Device_Disconnected')),
        });
        await waitFor(() => store.getState().connectPopup.activeCall?.state === 'call-error');
        // The user closes the error instead of retrying the call.
        store.dispatch(connectPopupActions.finishCall());
        store.dispatch(connectPopupActions.clearCall());
        const next = track(queuePopupCall());

        store.dispatch(connectPopupCancelThunk({}));
        await flush();

        expect(firstResponse.value).toEqual(interrupted);
        expect(next.value).toBeDefined();
        next.value?.resolve(signature('unused'));
    });

    it('answers a call that is canceled before it reaches the popup', async () => {
        const store = createStore();
        const first = await queuePopupCall();
        store.dispatch(
            connectPopupCallThunk({
                method: 'signMessage',
                payload: { path: "m/84'/0'/0'/0/0", message: 'first' },
                source,
                responseId: first.id,
            }),
        );
        await approveWhenAsked(store);
        await waitFor(() => deviceCalls.length > 0);
        store.dispatch(connectPopupCancelThunk({}));
        // The device is still busy with the first call, so the second one waits before the popup.
        const second = await queuePopupCall();
        const secondResponse = track(second.promise);
        store.dispatch(
            connectPopupCallThunk({
                method: 'signMessage',
                payload: { path: "m/84'/0'/0'/0/0", message: 'second' },
                source,
                responseId: second.id,
            }),
        );
        await flush();

        store.dispatch(connectPopupCancelThunk({}));
        await flush();

        expect(secondResponse.value).toEqual(interrupted);
        await answerDeviceCall('first', signature('signature-first'));
    });
});

describe('connectPopupCallThunk device', () => {
    const selectedWallet = {
        path: device.path,
        instance: device.instance,
        state: device.state,
        useEmptyPassphrase: device.useEmptyPassphrase,
    };
    const address: DeviceResponse = {
        success: true,
        payload: { address: 'address', path: [], serializedPath: "m/84'/0'/0'/0/0" },
    };

    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'call').mockImplementation(params =>
            Promise.resolve(
                '__info' in params
                    ? ({
                          success: true,
                          payload: { info: 'Get address', requiredPermissions: [], useUi: true },
                      } as DeviceResponse)
                    : address,
            ),
        );
    });

    afterEach(() => jest.restoreAllMocks());

    it('runs the call on the wallet selected in Suite when the payload names another one', async () => {
        const store = createStore();
        const deferred = createPopupCallDeferred();
        store.dispatch(
            connectPopupCallThunk({
                method: 'signMessage',
                payload: { path: "m/84'/0'/0'/0/0", message: 'message', device: { instance: 2 } },
                source,
                responseId: deferred.id,
            }),
        );
        await approveWhenAsked(store);
        await deferred.promise;

        expect(TrezorConnect.call).toHaveBeenLastCalledWith(
            expect.objectContaining({ device: selectedWallet }),
        );
    });

    it('shows an address on the wallet selected in Suite when the payload names another one', async () => {
        // The device keeps showing the address, the user exports it without confirming.
        jest.spyOn(TrezorConnect, 'getAddress').mockImplementation(() => new Promise(() => {}));
        const store = createStore();
        const deferred = createPopupCallDeferred();
        store.dispatch(
            connectPopupCallThunk({
                method: 'getAddress',
                payload: { path: "m/84'/0'/0'/0/0", device: { instance: 2 } },
                source,
                responseId: deferred.id,
            }),
        );
        await approveWhenAsked(store);
        await waitFor(
            () => store.getState().connectPopup.activeCall?.state === 'address-confirmation',
        );

        store.dispatch(connectPopupVerifyAddressThunk({ index: 0 }));
        getPermissionDeferred().resolve();
        await deferred.promise;

        expect(TrezorConnect.getAddress).toHaveBeenCalledWith(
            expect.objectContaining({ device: selectedWallet, showOnTrezor: true }),
        );
    });
});

describe('connectPopupCallThunk remembered permissions', () => {
    const accountInfo = { permission: 'read_account_info', coin: 'btc' } as const;
    const signing = { permission: 'sign' } as const;
    const client = { name: 'client', fullPath: '/usr/bin/client', warning: false };
    const mcpSource: ConnectCallSource = {
        type: CALL_SOURCE_MCP,
        origin: 'mcp://localhost',
        process: client,
        manifest: { appName: 'Client' },
    };
    const desktopSource: ConnectCallSource = {
        type: CALL_SOURCE_DESKTOP_WS,
        origin: 'mcp://localhost',
        process: client,
        manifest: { appName: 'Client' },
    };

    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'call').mockImplementation(params =>
            Promise.resolve(
                '__info' in params
                    ? ({
                          success: true,
                          payload: {
                              info: 'Get account info',
                              requiredPermissions: [accountInfo],
                              useUi: false,
                          },
                      } as DeviceResponse)
                    : ({ success: true, payload: {} } as DeviceResponse),
            ),
        );
    });

    afterEach(() => jest.restoreAllMocks());

    // Starts a call and returns whether it waits for the user to grant permissions.
    const asksForPermissions = async (store: Store, callSource: ConnectCallSource) => {
        const deferred = createPopupCallDeferred();
        store.dispatch(
            connectPopupCallThunk({
                method: 'getAccountInfo',
                payload: { coin: 'btc', path: "m/84'/0'/0'" },
                source: callSource,
                responseId: deferred.id,
            }),
        );
        await flush();
        const isAsking = store.getState().connectPopup.activeCall?.state === 'permission-request';
        if (isAsking) {
            store.dispatch(connectPopupActions.approvePermissions());
        }
        await deferred.promise;

        return isAsking;
    };

    it('uses permissions remembered for the same app', async () => {
        const store = createStore([{ ...mcpSource, allowedPermissions: [accountInfo] }]);

        expect(await asksForPermissions(store, mcpSource)).toBe(false);
    });

    it('adds permissions remembered again for the same app to its entry', () => {
        const store = createStore([{ ...desktopSource, allowedPermissions: [accountInfo] }]);
        store.dispatch(
            connectPopupActions.rememberAppPermissions({
                ...desktopSource,
                allowedPermissions: [signing],
            }),
        );

        expect(store.getState().connectPopup.permissions).toEqual([
            expect.objectContaining({ allowedPermissions: [accountInfo, signing] }),
        ]);
    });

    it('asks for permissions that are remembered only for an app of another source type', async () => {
        const store = createStore([{ ...mcpSource, allowedPermissions: [accountInfo] }]);

        expect(await asksForPermissions(store, desktopSource)).toBe(true);
    });

    it('does not add permissions remembered for one app to another app of the same origin', () => {
        const store = createStore();
        const otherProcess = { ...client, fullPath: '/usr/bin/other' };
        store.dispatch(
            connectPopupActions.rememberAppPermissions({
                ...desktopSource,
                allowedPermissions: [accountInfo],
            }),
        );
        store.dispatch(
            connectPopupActions.rememberAppPermissions({
                ...desktopSource,
                process: otherProcess,
                allowedPermissions: [signing],
            }),
        );

        expect(store.getState().connectPopup.permissions).toEqual([
            expect.objectContaining({ process: otherProcess, allowedPermissions: [signing] }),
        ]);
    });

    it('uses permissions remembered for a deeplink app with an https callback', async () => {
        const deeplinkSource: ConnectCallSource = {
            type: CALL_SOURCE_DEEPLINK,
            origin: 'https://app.example',
            manifest: { appName: 'App' },
        };
        const store = createStore();
        store.dispatch(
            connectPopupActions.rememberAppPermissions({
                ...deeplinkSource,
                allowedPermissions: [accountInfo],
            }),
        );

        expect(await asksForPermissions(store, deeplinkSource)).toBe(false);
    });

    describe.each([
        ['a desktop app whose process is unknown', { ...desktopSource, process: UNKNOWN_PROCESS }],
        ['an app with the origin null', { ...desktopSource, origin: 'null' }],
        [
            'an app whose origin it states itself',
            {
                type: CALL_SOURCE_WEB,
                origin: 'abcdefghijklmnopabcdefghijklmnop',
                manifest: { appName: 'App' },
                isOriginSelfDeclared: true,
            } satisfies ConnectCallSource,
        ],
        [
            'a deeplink app whose callback is not https',
            {
                type: CALL_SOURCE_DEEPLINK,
                origin: 'exampleapp://connect',
                manifest: { appName: 'App' },
            } satisfies ConnectCallSource,
        ],
    ])('for %s', (_, unidentifiedSource) => {
        it('does not remember permissions', () => {
            const store = createStore();
            store.dispatch(
                connectPopupActions.rememberAppPermissions({
                    ...unidentifiedSource,
                    allowedPermissions: [accountInfo],
                }),
            );

            expect(store.getState().connectPopup.permissions).toEqual([]);
        });

        it('asks for permissions even when they are remembered', async () => {
            const store = createStore([
                { ...unidentifiedSource, allowedPermissions: [accountInfo] },
            ]);

            expect(await asksForPermissions(store, unidentifiedSource)).toBe(true);
        });
    });
});

describe('connectPopupCallThunk cipherKeyValue', () => {
    const signing = { permission: 'sign' } as const;
    const labelingRequest = {
        path: "m/10015'/0'",
        key: 'Enable labeling?',
        value: '00'.repeat(32),
        encrypt: true,
        askOnEncrypt: true,
        askOnDecrypt: true,
    };
    const otherRequest = { ...labelingRequest, key: 'Other key' };

    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'call').mockImplementation(params =>
            Promise.resolve(
                '__info' in params
                    ? ({
                          success: true,
                          payload: {
                              info: 'Cipher key value',
                              requiredPermissions: [signing],
                              useUi: true,
                          },
                      } as DeviceResponse)
                    : ({ success: true, payload: { value: '00' } } as DeviceResponse),
            ),
        );
    });

    afterEach(() => jest.restoreAllMocks());

    // The app has the method's permission remembered, so the call reaches the device unless the
    // request itself is refused.
    const callCipherKeyValue = (
        payload: DistributiveOmit<CallMethodParams<'cipherKeyValue'>, 'method'>,
    ) => {
        const store = createStore([{ ...source, allowedPermissions: [signing] }]);
        const deferred = createPopupCallDeferred();
        store.dispatch(
            connectPopupCallThunk({
                method: 'cipherKeyValue',
                payload,
                source,
                responseId: deferred.id,
            }),
        );

        return deferred.promise;
    };

    it.each([
        ['alone', labelingRequest],
        ['in a bundle', { bundle: [otherRequest, labelingRequest] }],
        ['followed by a NUL character', { ...labelingRequest, key: 'Enable labeling?\0' }],
    ])(
        'does not pass a request for the Suite labeling key %s to the device',
        async (_, payload) => {
            const response = await callCipherKeyValue(payload);

            expect(response).toEqual(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({ code: 'Method_NotAllowed' }),
                }),
            );
            expect(TrezorConnect.call).toHaveBeenCalledTimes(1);
            expect(TrezorConnect.call).toHaveBeenCalledWith(
                expect.objectContaining({ __info: true }),
            );
        },
    );

    it('passes requests for other keys to the device', async () => {
        const response = await callCipherKeyValue(otherRequest);

        expect(response).toEqual({ success: true, payload: { value: '00' } });
    });
});
