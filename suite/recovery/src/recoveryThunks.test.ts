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

    it('checkSeedThunk resets the flow on user cancel instead of showing a failure screen', async () => {
        testMocks.setTrezorConnectFixtures({
            success: false,
            error: { code: 'Method_Cancel', message: 'Cancelled' },
        });
        const store = initStore({ error: 'stale error' });
        await store.dispatch(checkSeedThunk());
        // reset -> 'initial', NOT the 'finished' + error state that renders the failure screen
        expect(store.getState().recovery.status).toEqual('initial');
        expect(store.getState().recovery.error).toBeUndefined();
    });

    it('recoverDeviceThunk resets the flow on user cancel instead of showing a failure screen', async () => {
        testMocks.setTrezorConnectFixtures({
            success: false,
            error: { code: 'Method_Cancel', message: 'Cancelled' },
        });
        const store = initStore({ error: 'stale error' });
        await store.dispatch(recoverDeviceThunk());
        expect(store.getState().recovery.status).toEqual('initial');
        expect(store.getState().recovery.error).toBeUndefined();
    });

    it('recoveryRerunThunk resets the status and rejects when the device already left recovery', async () => {
        // fresh features report no recovery in progress
        testMocks.setTrezorConnectFixtures({ success: true, payload: {} });
        const store = initStore({ status: 'finished' });
        const result = await store.dispatch(recoveryRerunThunk());
        expect(recoveryRerunThunk.rejected.match(result)).toBe(true);
        // the transient 'in-progress' set by the thunk must be cleared, not left stuck
        expect(store.getState().recovery.status).toEqual('initial');
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

    it('recoveryRerunThunk resets and rejects when the selected device changes during getFeatures', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { recovery_status: 'Recovery', initialized: true },
        });
        // A store whose selected-device path is swapped mid-thunk (while getFeatures is awaited),
        // to exercise the device-changed guard.
        const store = configureMockStore({
            preloadedState: {
                ...getInitialState(),
                device: {
                    selectedDevice: {
                        features: { major_version: 2, internal_model: DeviceModelInternal.T2T1 },
                        path: 'device-a',
                    },
                },
            },
            reducer: (state: any, action: any) => ({
                ...state,
                recovery: recoveryReducer(state.recovery, action),
                device:
                    action.type === 'TEST/SWAP_DEVICE'
                        ? { selectedDevice: { ...state.device.selectedDevice, path: 'device-b' } }
                        : state.device,
            }),
        });

        const action = store.dispatch(recoveryRerunThunk());
        // the thunk has captured 'device-a' and is now awaiting getFeatures; swap the selected device
        store.dispatch({ type: 'TEST/SWAP_DEVICE' });
        const result = await action;

        expect(recoveryRerunThunk.rejected.match(result)).toBe(true);
        // the transient 'in-progress' set before the await must be cleared
        expect(store.getState().recovery.status).toEqual('initial');
    });
});
