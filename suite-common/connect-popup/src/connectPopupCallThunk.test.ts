import { combineReducers } from '@reduxjs/toolkit';

import { mock, mockNotExpected } from '@suite-common/dependency-injection';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { type LockDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import TrezorConnect, { type CallMethodAnyResponse } from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { getSynchronize } from '@trezor/utils';

import { connectPopupActions } from './connectPopupActions';
import { queuePopupCall } from './connectPopupPromiseManager';
import { prepareConnectPopupReducer } from './connectPopupReducer';
import {
    type ConnectPopupCallThunkDeps,
    type ConnectPopupCallThunkState,
    connectPopupCallInnerThunk,
    connectPopupCallThunk,
    connectPopupCancelThunk,
    connectPopupDeeplinkThunk,
} from './connectPopupThunks';
import { CALL_SOURCE_WEB, type ConnectCallSource } from './connectPopupTypes';

type DeviceResponse = Awaited<CallMethodAnyResponse>;

const device = mockSuiteDevice({
    connected: true,
    path: '1',
    instance: 0,
    useEmptyPassphrase: true,
});
const deviceState: DeviceReducerState = { ...deviceInitialState, selectedDevice: device };

const createStore = () =>
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
            connectPopup: { activeCall: undefined, permissions: [] },
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
