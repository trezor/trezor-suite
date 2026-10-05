import { combineReducers } from '@reduxjs/toolkit';

import { mock, mockNotExpected } from '@suite-common/dependency-injection';
import { type DeviceReducerState, deviceActions, deviceInitialState } from '@suite-common/device';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { type LockDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { connectPopupActions } from './connectPopupActions';
import { prepareConnectPopupReducer } from './connectPopupReducer';
import {
    type ConnectPopupCallThunkDeps,
    type ConnectPopupCallThunkState,
    type ConnectPopupCancelThunkState,
    connectPopupCallThunk,
    connectPopupCancelThunk,
    connectPopupVerifyAddressThunk,
} from './connectPopupThunks';
import {
    CALL_SOURCE_WEB,
    type ConnectCallSource,
    type ConnectPopupCall,
} from './connectPopupTypes';

const connectPopupReducer = prepareConnectPopupReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const source: ConnectCallSource = {
    type: CALL_SOURCE_WEB,
    origin: 'https://example.com',
    manifest: { appName: 'Test app' },
};

const createActiveCall = (callId?: string): ConnectPopupCall => ({
    state: 'ongoing',
    method: 'getAddress',
    payload: {},
    methodInfo: { methodTitle: '', permissionTypes: [], useUi: true },
    source,
    callId,
});

const createStore = (activeCall: ConnectPopupCall) =>
    createTestCompositionRoot<void, ConnectPopupCancelThunkState>({
        reducer: combineReducers({ connectPopup: connectPopupReducer }),
        preloadedState: { connectPopup: { activeCall, permissions: [] } },
    }).services.store;

const device = mockSuiteDevice({
    connected: true,
    path: '1',
    instance: 0,
    useEmptyPassphrase: true,
});
const deviceState: DeviceReducerState = { ...deviceInitialState, selectedDevice: device };

const createCallStore = (activeCall?: ConnectPopupCall) =>
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
            connectPopup: connectPopupReducer,
            device: (state: DeviceReducerState = deviceState) => state,
        }),
        preloadedState: { connectPopup: { activeCall, permissions: [] }, device: deviceState },
    }).services.store;

const waitFor = async (condition: () => boolean) => {
    for (let i = 0; i < 20 && !condition(); i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    expect(condition()).toBe(true);
};

// `finishCall` is the teardown marker: the cancel thunk dispatches it only on the path that tears
// down the active popup, so its absence proves a forwarded cancel left the popup running.
const hasFinishedCall = (store: ReturnType<typeof createStore>) =>
    store.getActions().some(action => action.type === connectPopupActions.finishCall.type);

describe('connectPopupCancelThunk', () => {
    let cancelSpy: jest.SpiedFunction<typeof TrezorConnect.cancel>;

    beforeEach(() => {
        cancelSpy = jest.spyOn(TrezorConnect, 'cancel').mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it('forwards a cancel for another call without tearing down the active popup', () => {
        const store = createStore(createActiveCall('active-id'));

        store.dispatch(connectPopupCancelThunk({ callId: 'other-id' }));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'other-id' });
        expect(hasFinishedCall(store)).toBe(false);
        expect(
            store
                .getActions()
                .some(action => action.type === deviceActions.removeButtonRequests.type),
        ).toBe(false);
    });

    it('tears down the active popup when callId matches', () => {
        const store = createStore(createActiveCall('active-id'));

        store.dispatch(connectPopupCancelThunk({ callId: 'active-id' }));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'active-id' });
        expect(hasFinishedCall(store)).toBe(true);
    });

    it('scopes a plain cancel to the active call', () => {
        const store = createStore(createActiveCall('active-id'));

        store.dispatch(connectPopupCancelThunk({}));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'active-id' });
    });

    it('preserves full teardown for an active call without callId', () => {
        const store = createStore(createActiveCall());

        store.dispatch(connectPopupCancelThunk({ callId: 'caller-id' }));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'caller-id' });
        expect(hasFinishedCall(store)).toBe(true);
    });

    it('does not cancel other calls when neither the cancel nor the active call has a callId', () => {
        const store = createStore(createActiveCall());

        store.dispatch(connectPopupCancelThunk({}));

        expect(cancelSpy).not.toHaveBeenCalled();
        expect(hasFinishedCall(store)).toBe(true);
    });

    it('ends a cancel with an empty callId by the callId of the active call', () => {
        const store = createStore(createActiveCall('active-id'));

        store.dispatch(connectPopupCancelThunk({ callId: '' }));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'active-id' });
        expect(hasFinishedCall(store)).toBe(true);
    });

    describe('popup call on the device', () => {
        let callSpy: jest.SpiedFunction<typeof TrezorConnect.call>;

        beforeEach(() => {
            callSpy = jest.spyOn(TrezorConnect, 'call').mockImplementation(params =>
                '__info' in params
                    ? Promise.resolve({
                          success: true,
                          payload: { info: 'Export address', requiredPermissions: [], useUi: true },
                      })
                    : new Promise(() => {}),
            );
        });

        const getDeviceCallId = () =>
            callSpy.mock.calls.find(([params]) => !('__info' in params))?.[0].callId;

        const startCallOnDevice = async (payload: { path: string; callId?: string }) => {
            const store = createCallStore();
            store.dispatch(connectPopupCallThunk({ method: 'getAddress', payload, source }));
            await waitFor(
                () => store.getState().connectPopup.activeCall?.state === 'permission-request',
            );
            store.dispatch(connectPopupActions.approvePermissions());
            await waitFor(() => callSpy.mock.calls.length === 2);

            return store;
        };

        it('runs a call without its own callId under one that a cancel ends', async () => {
            const store = await startCallOnDevice({ path: "m/84'/0'/0'/0/0" });

            store.dispatch(connectPopupCancelThunk({}));

            const deviceCallId = getDeviceCallId();
            expect(deviceCallId).toEqual(expect.any(String));
            expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: deviceCallId });
        });

        it("runs a call under the caller's own callId", async () => {
            const callId = '33333333-3333-4333-8333-333333333333';
            const store = await startCallOnDevice({ path: "m/84'/0'/0'/0/0", callId });

            store.dispatch(connectPopupCancelThunk({}));

            expect(getDeviceCallId()).toBe(callId);
            expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId });
        });
    });

    it('checks an address on the device under the callId of its call', async () => {
        const getAddressSpy = jest
            .spyOn(TrezorConnect, 'getAddress')
            .mockImplementation(() => new Promise(() => {}));
        const store = createCallStore({
            state: 'address-confirmation',
            method: 'getAddress',
            payload: {},
            methodInfo: { methodTitle: '', permissionTypes: [], useUi: true },
            source,
            exported: false,
            addresses: [
                {
                    address: 'address',
                    loading: false,
                    validated: 'not-started',
                    validatePayload: { path: "m/84'/0'/0'/0/0" },
                },
            ],
            callId: 'active-id',
        });

        store.dispatch(connectPopupVerifyAddressThunk({ index: 0 }));
        await waitFor(() => getAddressSpy.mock.calls.length > 0);

        expect(getAddressSpy).toHaveBeenCalledWith(
            expect.objectContaining({ callId: 'active-id' }),
        );
    });
});
