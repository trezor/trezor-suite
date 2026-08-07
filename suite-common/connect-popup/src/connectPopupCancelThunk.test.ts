import { deviceActions } from '@suite-common/device';
import { configureMockStore } from '@suite-common/test-utils';
import TrezorConnect, { type DeviceUniquePath, asDeviceUniquePath } from '@trezor/connect';

import { connectPopupActions } from './connectPopupActions';
import { connectPopupCancelThunk } from './connectPopupThunks';
import { CALL_SOURCE_WEB, type ConnectPopupCall } from './connectPopupTypes';

const createActiveCall = (devicePath?: DeviceUniquePath): ConnectPopupCall => ({
    state: 'ongoing',
    method: 'getAddress',
    payload: {},
    methodInfo: { methodTitle: '', permissionTypes: [], useUi: true },
    source: {
        type: CALL_SOURCE_WEB,
        origin: 'https://example.com',
        manifest: { appName: 'Test app' },
    },
    devicePath,
});

const createStore = (activeCall: ConnectPopupCall) =>
    configureMockStore({
        preloadedState: { connectPopup: { activeCall, permissions: [] } },
    });

describe('connectPopupCancelThunk', () => {
    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'cancel').mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it('clears button requests for the stored device path on cancel', () => {
        const store = createStore(createActiveCall(asDeviceUniquePath('A')));

        store.dispatch(connectPopupCancelThunk({}));

        const actions = store.getActions();
        expect(actions).toContainEqual(
            deviceActions.removeButtonRequests({ path: asDeviceUniquePath('A') }),
        );
        expect(actions.some(a => a.type === connectPopupActions.setError.type)).toBe(true);
    });

    it('has nothing to clear before the device phase (no stored device path)', () => {
        const store = createStore(createActiveCall());

        store.dispatch(connectPopupCancelThunk({}));

        const actions = store.getActions();
        // A removeButtonRequests with an undefined path is a reducer no-op.
        expect(actions).toContainEqual(deviceActions.removeButtonRequests({ path: undefined }));
    });
});
