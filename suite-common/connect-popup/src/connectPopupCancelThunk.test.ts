import { combineReducers } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';
import { mockActionType } from '@trezor/redux-utils/mocks';

import { connectPopupActions } from './connectPopupActions';
import { prepareConnectPopupReducer } from './connectPopupReducer';
import { type ConnectPopupCancelThunkState, connectPopupCancelThunk } from './connectPopupThunks';
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
    createTestCompositionRoot<void, ConnectPopupCancelThunkState>({
        reducer: combineReducers({ connectPopup: connectPopupReducer }),
        preloadedState: { connectPopup: { activeCall, permissions: [] } },
    }).services.store;

// `finishCall` is the teardown marker: the cancel thunk dispatches it only on the path that tears
// down the active popup, so its presence proves the popup was ended.
const hasFinishedCall = (store: ReturnType<typeof createStore>) =>
    store.getActions().some(action => action.type === connectPopupActions.finishCall.type);

describe('connectPopupCancelThunk', () => {
    let cancelSpy: jest.SpiedFunction<typeof TrezorConnect.cancel>;

    beforeEach(() => {
        cancelSpy = jest.spyOn(TrezorConnect, 'cancel').mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it('tears down the active popup even when the cancel names another call', () => {
        const store = createStore(createActiveCall('active-id'));

        store.dispatch(connectPopupCancelThunk({ callId: 'other-id' }));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'other-id' });
        expect(hasFinishedCall(store)).toBe(true);
        expect(
            store
                .getActions()
                .some(action => action.type === deviceActions.removeButtonRequests.type),
        ).toBe(true);
    });

    it('passes a plain cancel on without any callId', () => {
        const store = createStore(createActiveCall('active-id'));

        store.dispatch(connectPopupCancelThunk({}));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: undefined });
    });
});
