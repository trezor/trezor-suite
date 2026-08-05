import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { recoveryReducer } from './recoveryReducer';
import { checkSeedThunk, recoverDeviceThunk, recoveryRerunThunk } from './recoveryThunks';

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

const initStore = (custom?: any) => {
    const preloadedState = getInitialState(custom);
    const store = configureMockStore({
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

    afterEach(() => {
        testMocks.setTrezorConnectFixtures(undefined);
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

    it('recoveryRerunThunk fulfills with initialized and does not start the seed-input flow itself', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { recovery_status: 'Recovery', initialized: true },
        });
        const store = initStore();
        const result = await store.dispatch(recoveryRerunThunk());
        expect(recoveryRerunThunk.fulfilled.match(result)).toBe(true);
        if (recoveryRerunThunk.fulfilled.match(result)) {
            expect(result.payload).toEqual({ initialized: true });
        }
        // the seed-input thunk is started by the caller AFTER navigation, so no recoveryDevice call
        // has run here; the status must remain 'in-progress' (it would be 'finished' otherwise)
        expect(store.getState().recovery.status).toEqual('in-progress');
    });
});
