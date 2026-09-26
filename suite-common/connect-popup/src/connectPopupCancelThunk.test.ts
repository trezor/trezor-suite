import { combineReducers } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { connectPopupActions } from './connectPopupActions';
import { prepareConnectPopupReducer } from './connectPopupReducer';
import { connectPopupCancelThunk } from './connectPopupThunks';
import { CALL_SOURCE_WEB, type ConnectPopupCall } from './connectPopupTypes';

const connectPopupReducer = prepareConnectPopupReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const createActiveCall = (callId?: string): ConnectPopupCall => ({
    state: 'ongoing',
    method: 'getAddress',
    payload: {},
    methodInfo: { methodTitle: '', permissionTypes: [], useUi: true },
    source: {
        type: CALL_SOURCE_WEB,
        origin: 'https://example.com',
        manifest: { appName: 'Test app' },
    },
    callId,
});

const createStore = (activeCall: ConnectPopupCall) =>
    createTestStore({
        extra: undefined,
        reducer: combineReducers({ connectPopup: connectPopupReducer }),
        preloadedState: { connectPopup: { activeCall, permissions: [] } },
    });

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
});
