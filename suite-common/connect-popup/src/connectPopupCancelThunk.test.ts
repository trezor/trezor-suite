import { deviceActions } from '@suite-common/device';
import { configureMockStore } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { connectPopupActions } from './connectPopupActions';
import { connectPopupCancelThunk } from './connectPopupThunks';
import { CALL_SOURCE_WEB, type ConnectPopupCall } from './connectPopupTypes';

type ActiveCallFixture = ConnectPopupCall & { callId?: string };

const createActiveCall = (callId?: string): ActiveCallFixture => ({
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

const createStore = (activeCall: ActiveCallFixture) =>
    configureMockStore({
        preloadedState: { connectPopup: { activeCall, permissions: [] } },
    });

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
        const actions = store.getActions();
        expect(actions.some(action => action.type === connectPopupActions.setError.type)).toBe(false);
        expect(
            actions.some(action => action.type === deviceActions.removeButtonRequests.type),
        ).toBe(false);
    });

    it('tears down the active popup when callId matches', () => {
        const store = createStore(createActiveCall('active-id'));

        store.dispatch(connectPopupCancelThunk({ callId: 'active-id' }));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'active-id' });
        expect(
            store
                .getActions()
                .some(action => action.type === connectPopupActions.setError.type),
        ).toBe(true);
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
        expect(
            store
                .getActions()
                .some(action => action.type === connectPopupActions.setError.type),
        ).toBe(true);
    });
});
