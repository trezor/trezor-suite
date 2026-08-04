import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { recoveryReducer } from './recoveryReducer';
import { checkSeedThunk, recoverDeviceThunk } from './recoveryThunks';

const getInitialState = (custom?: any): any => ({
    suite: {
        flags: {},
        locks: [],
    },
    device: {
        selectedDevice: {
            features: {
                major_version: 2,
                internal_model: DeviceModelInternal.T2T1,
            },
        },
    },
    recovery: {
        ...recoveryReducer(undefined, { type: 'foo' }),
        ...custom,
    },
    analytics: {
        enabled: false,
    },
});

const device = {
    features: {
        major_version: 2,
        internal_model: DeviceModelInternal.T2T1,
    },
    path: '1',
} as any;

const initStore = (custom?: any) => {
    const preloadedState = getInitialState(custom);
    const store = createTestStore({
        extra: { services: { analytics: mockDesktopAnalytics() } },
        preloadedState,
        reducer: (state: any, action: any) => ({
            ...state,
            recovery: recoveryReducer(state.recovery, action),
        }),
    });

    return store;
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
        const action = store.dispatch(recoverDeviceThunk({ device }));
        expect(store.getState().recovery.status).toMatch('in-progress');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
    });

    it('checkSeedThunk', async () => {
        const store = initStore();
        const action = store.dispatch(checkSeedThunk({ device }));
        expect(store.getState().recovery.status).toMatch('in-progress');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
    });
});
