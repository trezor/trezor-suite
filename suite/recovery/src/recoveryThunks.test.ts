import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { deviceInitialState } from '@suite-common/device';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import TrezorConnect, { type PROTO } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { type WithServices } from '@trezor/redux-utils';

import { type RecoveryState, recoveryReducer } from './recoveryReducer';
import { type RecoverDeviceThunkState, checkSeedThunk, recoverDeviceThunk } from './recoveryThunks';

const getInitialState = (
    custom?: Partial<RecoveryState>,
    recoveryType?: PROTO.RecoveryType,
): RecoverDeviceThunkState => ({
    device: {
        ...deviceInitialState,
        selectedDevice: {
            id: 'device-id',
            features: {
                major_version: 2,
                internal_model: DeviceModelInternal.T2T1,
                recovery_type: recoveryType,
            },
        } as NonNullable<RecoverDeviceThunkState['device']['selectedDevice']>,
    },
    recovery: {
        ...recoveryReducer(undefined, { type: 'foo' }),
        ...custom,
    },
});

const initStore = (custom?: Partial<RecoveryState>, recoveryType?: PROTO.RecoveryType) => {
    const preloadedState = getInitialState(custom, recoveryType);

    return createTestCompositionRoot<WithServices<DesktopAnalyticsDep>, RecoverDeviceThunkState>({
        preloadedState,
        reducer: (state = preloadedState, action) => ({
            ...state,
            recovery: recoveryReducer(state.recovery, action),
        }),
        services: () => ({ analytics: mockDesktopAnalytics() }),
    }).services.store;
};

describe('Recovery Thunks', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('recoverDeviceThunk', async () => {
        const store = initStore();
        const action = store.dispatch(recoverDeviceThunk());
        expect(store.getState().recovery.status).toMatch('in-progress');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
    });

    it('checkSeedThunk', async () => {
        const store = initStore();
        const action = store.dispatch(checkSeedThunk());
        expect(store.getState().recovery.status).toMatch('in-progress');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
    });
});

describe('Recovery Thunks with entropy check xpub hashes', () => {
    const clearXPubHashesAction = persistentDeviceDataActions.clearEntropyCheckXPubHashes({
        deviceId: 'device-id',
    });

    const mockRecoveryDevice = (success: boolean) =>
        jest
            .spyOn(TrezorConnect, 'recoveryDevice')
            .mockResolvedValue(
                success
                    ? { success: true, payload: { message: 'Success' } }
                    : { success: false, error: { code: 'Failure_ActionCancelled', message: 'x' } },
            );

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('clears xpub hashes after a successful recovery', async () => {
        mockRecoveryDevice(true);
        const store = initStore();
        await store.dispatch(recoverDeviceThunk());

        expect(store.getActions()).toContainEqual(clearXPubHashesAction);
    });

    it('keeps xpub hashes after a failed recovery', async () => {
        mockRecoveryDevice(false);
        const store = initStore();
        await store.dispatch(recoverDeviceThunk());

        expect(store.getActions()).not.toContainEqual(clearXPubHashesAction);
    });

    it.each(['DryRun', 'UnlockRepeatedBackup'] as const)(
        'keeps xpub hashes after a successful recovery of type %s',
        async recoveryType => {
            mockRecoveryDevice(true);
            const store = initStore(undefined, recoveryType);
            await store.dispatch(recoverDeviceThunk());

            expect(store.getActions()).not.toContainEqual(clearXPubHashesAction);
        },
    );

    it('keeps xpub hashes after a successful seed check', async () => {
        mockRecoveryDevice(true);
        const store = initStore();
        await store.dispatch(checkSeedThunk());

        expect(store.getActions()).not.toContainEqual(clearXPubHashesAction);
    });
});
