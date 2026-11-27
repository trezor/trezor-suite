import { combineReducers } from '@reduxjs/toolkit';

import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { type LockDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';
import { TypedError, serializeError } from '@trezor/connect-common/src/constants/errors';
import { mock, mockNotExpected } from '@trezor/dependency-injection';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { connectPopupActions } from './connectPopupActions';
import { type PopupCallResponse } from './connectPopupCallQueue';
import { prepareConnectPopupReducer, selectConnectPopupCall } from './connectPopupReducer';
import {
    type ConnectPopupCallInnerThunkDeps,
    type ConnectPopupCallInnerThunkState,
    connectPopupCallInnerThunk,
    connectPopupFinishCallThunk,
} from './connectPopupThunks';
import {
    CALL_SOURCE_DESKTOP_WS,
    CALL_SOURCE_WALLETCONNECT,
    type ConnectCallSource,
} from './connectPopupTypes';
import { type RequestPopupCallDeps, createRequestPopupCall } from './createRequestPopupCall';

const CLIENT_CALL_ID = '11111111-1111-4111-8111-111111111111';

const fakeDeviceState: DeviceReducerState = {
    ...deviceInitialState,
    selectedDevice: mockSuiteDevice({
        connected: true,
        path: '1',
        instance: 0,
        state: undefined,
        useEmptyPassphrase: true,
    }),
};

const connectPopupReducer = prepareConnectPopupReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

// A desktop app has to be approved on the permission screen first, a WalletConnect dapp not.
const desktopApp = (appName: string): ConnectCallSource => ({
    type: CALL_SOURCE_DESKTOP_WS,
    origin: `ws://${appName}`,
    manifest: { appName },
    process: { name: appName, fullPath: `/usr/bin/${appName}`, warning: false },
});
const dapp: ConnectCallSource = {
    type: CALL_SOURCE_WALLETCONNECT,
    origin: 'https://dapp.example',
    manifest: { appName: 'dapp' },
};

const signMessage = (source: ConnectCallSource, payload: object = {}) => ({
    method: 'signMessage' as const,
    payload: { path: "m/84'/0'/0'/0/0", message: source.manifest.appName, ...payload },
    source,
});

const signed = (signature: string): PopupCallResponse =>
    ({ success: true, payload: { signature } }) as PopupCallResponse;
const failed = (code: string) => ({ success: false, error: expect.objectContaining({ code }) });

type InitPopupCallsParams = Pick<RequestPopupCallDeps, 'shouldReplacePendingCalls'>;

// The service on a real store, so that the calls run through their thunks and the popup state.
const initPopupCalls = ({ shouldReplacePendingCalls }: InitPopupCallsParams) => {
    const { store } = createTestCompositionRoot<
        ConnectPopupCallInnerThunkDeps,
        ConnectPopupCallInnerThunkState
    >({
        services: () => ({
            lockDevice: mock<LockDevice>(),
            analytics: {
                init: mockNotExpected('init'),
                enable: mockNotExpected('enable'),
                disable: mockNotExpected('disable'),
                isEnabled: mockNotExpected('isEnabled'),
                setUrl: mockNotExpected('setUrl'),
                setLoggerEnabled: mockNotExpected('setLoggerEnabled'),
                report: mock(),
            },
        }),
        reducer: combineReducers({
            connectPopup: connectPopupReducer,
            device: (state = fakeDeviceState) => state,
        }),
        preloadedState: {
            connectPopup: { activeCall: undefined, permissions: [] },
            device: fakeDeviceState,
        },
    }).services;
    const deps: RequestPopupCallDeps = {
        dispatch: store.dispatch,
        getState: store.getState,
        shouldReplacePendingCalls,
    };

    return {
        store,
        requestPopupCall: createRequestPopupCall(deps),
        getActiveCall: () => selectConnectPopupCall(store.getState()),
    };
};

type ConnectCall = { params: Record<string, unknown>; answer: (response: unknown) => void };

// Connect answers a method info at once, unless `methodInfos` is given to answer it by hand.
// A call for the device is always answered by hand.
const mockConnect = (methodInfos?: ConnectCall[]) => {
    const deviceCalls: ConnectCall[] = [];
    const methodInfo = {
        success: true,
        payload: { info: 'Sign message', requiredPermissions: [], useUi: true },
    };
    jest.spyOn(TrezorConnect, 'call').mockImplementation((params: object) => {
        let answer!: (response: unknown) => void;
        const promise = new Promise<unknown>(resolve => {
            answer = resolve;
        });
        const call = { params: { ...params }, answer };
        if (!('__info' in params)) {
            deviceCalls.push(call);
        } else if (methodInfos) {
            methodInfos.push(call);
        } else {
            answer(methodInfo);
        }

        return promise as ReturnType<typeof TrezorConnect.call>;
    });
    const cancel = jest.spyOn(TrezorConnect, 'cancel').mockImplementation(() => {});

    return { deviceCalls, methodInfo, cancel };
};

// Lets the popup flows run until they wait for the user, for the device or for their turn.
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

const isAnswered = async (response: Promise<PopupCallResponse>) => {
    let hasAnswer = false;
    void response.then(() => {
        hasAnswer = true;
    });
    await flush();

    return hasAnswer;
};

describe('createRequestPopupCall', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('answers each caller with its own call when the call before it is rejected', async () => {
        const { deviceCalls } = mockConnect();
        const { store, requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });

        // The attacker holds the popup with a call the user will reject, and queues another call
        // behind the one of the victim.
        const rejected = requestPopupCall(signMessage(desktopApp('attacker')));
        const victim = requestPopupCall(signMessage(desktopApp('victim')));
        const attacker = requestPopupCall(signMessage(desktopApp('attacker')));
        await flush();
        expect(getActiveCall()).toMatchObject({
            state: 'permission-request',
            source: { origin: 'ws://attacker' },
        });

        store.dispatch(connectPopupActions.rejectPermissions(TypedError('Method_Cancel')));
        await expect(rejected).resolves.toEqual(failed('Method_Cancel'));
        await flush();

        // Only the call of the victim has started, the second call of the attacker still waits.
        expect(getActiveCall()).toMatchObject({
            state: 'permission-request',
            source: { origin: 'ws://victim' },
        });
        store.dispatch(connectPopupActions.approvePermissions());
        await flush();
        expect(deviceCalls).toHaveLength(1);
        deviceCalls[0]!.answer(signed('signature of the victim'));

        await expect(victim).resolves.toEqual(signed('signature of the victim'));
        expect(await isAnswered(attacker)).toBe(false);
        expect(getActiveCall()).toMatchObject({
            state: 'permission-request',
            source: { origin: 'ws://attacker' },
        });

        store.dispatch(connectPopupActions.rejectPermissions(TypedError('Method_Cancel')));
        await expect(attacker).resolves.toEqual(failed('Method_Cancel'));
    });

    it('does not pass the late result of a cancelled call to the next caller', async () => {
        const { deviceCalls, cancel } = mockConnect();
        const { store, requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });
        const abortController = new AbortController();

        const cancelled = requestPopupCall({
            ...signMessage(dapp),
            signal: abortController.signal,
        });
        const victim = requestPopupCall(signMessage(desktopApp('victim')));
        await flush();
        const runningCall = getActiveCall();
        const cancelledCallId =
            runningCall?.state === 'ongoing' ? runningCall.callId : 'no running call';

        abortController.abort('Connection closed');

        await expect(cancelled).resolves.toEqual(failed('Method_Interrupted'));
        expect(cancel).toHaveBeenCalledWith({
            reason: 'Connection closed',
            callId: cancelledCallId,
        });
        await flush();
        expect(getActiveCall()).toMatchObject({
            state: 'permission-request',
            source: { origin: 'ws://victim' },
        });

        // Connect ends the cancelled call only now, while the popup shows the call of the victim.
        deviceCalls[0]!.answer({
            success: false,
            error: serializeError(TypedError('Method_Cancel')),
        });
        await flush();

        expect(await isAnswered(victim)).toBe(false);
        expect(getActiveCall()).toMatchObject({
            state: 'permission-request',
            source: { origin: 'ws://victim' },
        });

        store.dispatch(connectPopupActions.approvePermissions());
        await flush();
        deviceCalls[1]!.answer(signed('signature of the victim'));
        await expect(victim).resolves.toEqual(signed('signature of the victim'));
    });

    it('makes a WalletConnect call wait for the running call, as any other call', async () => {
        const { deviceCalls } = mockConnect();
        const { store, requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });

        const desktopCall = requestPopupCall(signMessage(desktopApp('app')));
        const dappCall = requestPopupCall(signMessage(dapp));
        await flush();

        // The dapp neither replaces the permission screen of the app nor reaches the device.
        expect(getActiveCall()).toMatchObject({
            state: 'permission-request',
            source: { origin: 'ws://app' },
        });
        expect(deviceCalls).toHaveLength(0);

        store.dispatch(connectPopupActions.approvePermissions());
        await flush();
        deviceCalls[0]!.answer(signed('for the app'));
        await expect(desktopCall).resolves.toEqual(signed('for the app'));
        await flush();
        deviceCalls[1]!.answer(signed('for the dapp'));
        await expect(dappCall).resolves.toEqual(signed('for the dapp'));
    });

    it('cancels a waiting call without touching the running one', async () => {
        const { deviceCalls, cancel } = mockConnect();
        const { requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });
        const abortController = new AbortController();

        const running = requestPopupCall(signMessage(dapp));
        const waiting = requestPopupCall({
            ...signMessage(desktopApp('app')),
            signal: abortController.signal,
        });
        await flush();

        abortController.abort();

        await expect(waiting).resolves.toEqual(failed('Method_Cancel'));
        expect(cancel).not.toHaveBeenCalled();
        expect(getActiveCall()).toMatchObject({
            state: 'ongoing',
            source: { origin: dapp.origin },
        });

        deviceCalls[0]!.answer(signed('for the dapp'));
        await expect(running).resolves.toEqual(signed('for the dapp'));
        await flush();
        // The cancelled call has never started.
        expect(TrezorConnect.call).toHaveBeenCalledTimes(2);
    });

    it('does not start a call whose signal is aborted already', async () => {
        mockConnect();
        const { requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });
        const abortController = new AbortController();
        abortController.abort();

        const response = requestPopupCall({
            ...signMessage(dapp),
            signal: abortController.signal,
        });

        await expect(response).resolves.toEqual(failed('Method_Cancel'));
        await flush();
        expect(TrezorConnect.call).not.toHaveBeenCalled();
        expect(getActiveCall()).toBeUndefined();
    });

    it('ignores the cancel of a call which is already answered', async () => {
        const { deviceCalls, cancel } = mockConnect();
        const { requestPopupCall } = initPopupCalls({ shouldReplacePendingCalls: false });
        const abortController = new AbortController();

        const answered = requestPopupCall({
            ...signMessage(dapp),
            signal: abortController.signal,
        });
        const next = requestPopupCall(signMessage(dapp));
        await flush();
        deviceCalls[0]!.answer(signed('first'));
        await answered;
        await flush();

        abortController.abort();

        expect(cancel).not.toHaveBeenCalled();
        deviceCalls[1]!.answer(signed('second'));
        await expect(next).resolves.toEqual(signed('second'));
    });

    it('runs the call in Connect under its own id, not under the one the caller picked', async () => {
        const { deviceCalls } = mockConnect();
        const { requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });

        const response = requestPopupCall(signMessage(dapp, { callId: CLIENT_CALL_ID }));
        await flush();
        const activeCall = getActiveCall();
        const callId = activeCall?.state === 'ongoing' ? activeCall.callId : undefined;

        expect(callId).toEqual(expect.any(String));
        expect(callId).not.toBe(CLIENT_CALL_ID);
        expect(deviceCalls[0]!.params.callId).toBe(callId);

        deviceCalls[0]!.answer(signed('done'));
        await response;
    });

    it('neither opens the popup nor asks the device for a call cancelled while it started', async () => {
        const methodInfos: ConnectCall[] = [];
        const { deviceCalls, methodInfo } = mockConnect(methodInfos);
        const { requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });
        const abortController = new AbortController();

        const response = requestPopupCall({
            ...signMessage(dapp),
            signal: abortController.signal,
        });
        await flush();
        abortController.abort();
        await expect(response).resolves.toEqual(failed('Method_Interrupted'));

        methodInfos[0]!.answer(methodInfo);
        await flush();

        expect(getActiveCall()).toBeUndefined();
        expect(deviceCalls).toHaveLength(0);
    });

    it('answers the caller of a call which is retried after a device error', async () => {
        const { deviceCalls } = mockConnect();
        const { store, requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });

        const response = requestPopupCall(signMessage(dapp));
        await flush();
        deviceCalls[0]!.answer({
            success: false,
            error: serializeError(TypedError('Device_Disconnected')),
        });
        await flush();
        const failedCall = getActiveCall();
        if (failedCall?.state !== 'call-error') throw new Error('Expected a call error');
        expect(await isAnswered(response)).toBe(false);

        // The way the error modal retries the call.
        store.dispatch(connectPopupCallInnerThunk({ ...failedCall }));
        await flush();
        deviceCalls[1]!.answer(signed('after the retry'));

        await expect(response).resolves.toEqual(signed('after the retry'));
    });

    it('lets the newest call take the popup over where a call may never be answered', async () => {
        const { deviceCalls, cancel } = mockConnect();
        const { requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: true,
        });

        // The user leaves the popup screen of this call, which nothing reports.
        const abandoned = requestPopupCall(signMessage(desktopApp('abandoned')));
        await flush();
        const abandonedCall = getActiveCall();
        if (abandonedCall?.state !== 'permission-request') {
            throw new Error('Expected a permission request');
        }

        const newest = requestPopupCall(signMessage(dapp));
        await flush();

        expect(cancel).toHaveBeenCalledWith({ reason: undefined, callId: abandonedCall.callId });
        expect(getActiveCall()).toMatchObject({
            state: 'ongoing',
            source: { origin: dapp.origin },
        });
        deviceCalls[0]!.answer(signed('for the dapp'));
        await expect(newest).resolves.toEqual(signed('for the dapp'));
        expect(await isAnswered(abandoned)).toBe(false);
    });

    it('answers a call that ended with a device error when its popup is closed', async () => {
        const { deviceCalls } = mockConnect();
        const { store, requestPopupCall, getActiveCall } = initPopupCalls({
            shouldReplacePendingCalls: false,
        });
        const error = serializeError(TypedError('Device_Disconnected'));

        const response = requestPopupCall(signMessage(dapp));
        await flush();
        deviceCalls[0]!.answer({ success: false, error });
        await flush();

        store.dispatch(connectPopupFinishCallThunk());

        await expect(response).resolves.toEqual({ success: false, error });
        expect(getActiveCall()?.state).toBe('finished');
    });
});
