import { deviceActions } from '@suite-common/device';
import { configureMockStore } from '@suite-common/test-utils';
import TrezorConnect, { asDeviceUniquePath } from '@trezor/connect';

import { connectPopupActions } from './connectPopupActions';
import { connectPopupCancelThunk } from './connectPopupThunks';

const activeCallWith = (meta: { callId?: string; devicePath?: string }) =>
    ({
        state: 'ongoing',
        method: 'getAddress',
        payload: {},
        methodInfo: { methodTitle: '', permissionTypes: [], useUi: true },
        source: {},
        ...meta,
    }) as any;

const storeWith = (activeCall: any) =>
    configureMockStore({
        preloadedState: { connectPopup: { activeCall, permissions: [] } },
    });

describe('connectPopupCancelThunk', () => {
    let cancelSpy: jest.SpyInstance;

    beforeEach(() => {
        cancelSpy = jest.spyOn(TrezorConnect, 'cancel').mockImplementation((() => {}) as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it('forwards a foreign callId to Core without touching the popup', () => {
        const store = storeWith(
            activeCallWith({ callId: 'active-id', devicePath: asDeviceUniquePath('A') }),
        );

        store.dispatch(connectPopupCancelThunk({ callId: 'other-id' }));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'other-id' });
        const actions = store.getActions();
        expect(actions.some(a => a.type === deviceActions.removeButtonRequests.type)).toBe(false);
        expect(actions.some(a => a.type === connectPopupActions.setError.type)).toBe(false);
    });

    it('tears down the popup and clears the stored device path on a matching callId', () => {
        const store = storeWith(
            activeCallWith({ callId: 'active-id', devicePath: asDeviceUniquePath('A') }),
        );

        store.dispatch(connectPopupCancelThunk({ callId: 'active-id' }));

        const actions = store.getActions();
        expect(actions).toContainEqual(
            deviceActions.removeButtonRequests({ path: asDeviceUniquePath('A') }),
        );
        expect(actions.some(a => a.type === connectPopupActions.setError.type)).toBe(true);
    });

    it('tears down the popup on a plain cancel (no callId), scoping the abort to the active call', () => {
        const store = storeWith(
            activeCallWith({ callId: 'active-id', devicePath: asDeviceUniquePath('A') }),
        );

        store.dispatch(connectPopupCancelThunk({}));

        const actions = store.getActions();
        expect(actions).toContainEqual(
            deviceActions.removeButtonRequests({ path: asDeviceUniquePath('A') }),
        );
        // The abort falls back to the active call's callId so Core scopes it to this call instead of
        // aborting all in-flight work (callId=undefined → cancel-everything).
        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'active-id' });
    });

    it('has nothing to clear before the device phase (no stored device path)', () => {
        const store = storeWith(activeCallWith({ callId: 'active-id' }));

        store.dispatch(connectPopupCancelThunk({ callId: 'active-id' }));

        const actions = store.getActions();
        // A removeButtonRequests with an undefined path is a reducer no-op.
        expect(actions).toContainEqual(deviceActions.removeButtonRequests({ path: undefined }));
    });

    it('tears down an unscoped active call (caller passed no callId) on a scoped cancel', () => {
        // The active call carries no callId (its caller never supplied one), so a scoped cancel can't
        // be matched against it — it falls through to the full teardown (pre-feature behaviour: any
        // cancel tears down an unscoped call), rather than being forwarded to Core and leaving the
        // popup hanging on the permission screen.
        const store = storeWith(activeCallWith({}));

        store.dispatch(connectPopupCancelThunk({ callId: 'caller-id' }));

        const actions = store.getActions();
        expect(actions.some(a => a.type === connectPopupActions.setError.type)).toBe(true);
    });

    it('forwards a foreign cancel in the pre-device window (callId stamped, no device path yet)', () => {
        // The call's callId is stamped at initiateCall, so it is already set during the pre-device
        // window (permission prompt / reconnect / preCallHooks) — before any device path exists. A
        // cancel for a different call must be forwarded to Core, not tear this call down, even here.
        const store = storeWith(activeCallWith({ callId: 'active-id' }));

        store.dispatch(connectPopupCancelThunk({ callId: 'other-id' }));

        expect(cancelSpy).toHaveBeenCalledWith({ reason: undefined, callId: 'other-id' });
        const actions = store.getActions();
        expect(actions.some(a => a.type === connectPopupActions.setError.type)).toBe(false);
    });
});
