import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { deviceInitialState } from '@suite-common/device';
import { type WithServices } from '@suite-common/redux-utils';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { type RecoveryState, recoveryReducer } from './recoveryReducer';
import { type RecoverDeviceThunkState, checkSeedThunk, recoverDeviceThunk } from './recoveryThunks';

const getInitialState = (custom?: Partial<RecoveryState>): RecoverDeviceThunkState => ({
    device: {
        ...deviceInitialState,
        selectedDevice: {
            features: { major_version: 2, internal_model: DeviceModelInternal.T2T1 },
        } as NonNullable<RecoverDeviceThunkState['device']['selectedDevice']>,
    },
    recovery: {
        ...recoveryReducer(undefined, { type: 'foo' }),
        ...custom,
    },
});

const initStore = (custom?: Partial<RecoveryState>) => {
    const preloadedState = getInitialState(custom);

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
