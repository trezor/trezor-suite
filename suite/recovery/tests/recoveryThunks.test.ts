import type { UnknownAction } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import { DeviceModelInternal } from '@trezor/device-utils';

import { recoveryReducer } from '../src/recoveryReducer';
import { checkSeedThunk, recoverDeviceThunk } from '../src/recoveryThunks';

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
        ...recoveryReducer(undefined, {} as UnknownAction),
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
