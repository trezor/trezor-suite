import { events } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import type { AcquiredDevice } from '@suite-common/suite-types';
import { mockDeviceFeatures, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore, testMocks } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import { recoveryReducer } from './recoveryReducer';
import { checkSeedThunk, recoverDeviceThunk, recoveryRerunThunk } from './recoveryThunks';

const device = mockSuiteDevice({ path: '1' }) as AcquiredDevice;

const getInitialState = (custom?: any): any => ({
    suite: {
        flags: {},
        locks: [],
    },
    device: {
        selectedDevice: device,
    },
    recovery: {
        ...recoveryReducer(undefined, { type: 'foo' }),
        ...custom,
    },
    analytics: {
        enabled: false,
    },
});

const initStore = (analytics = mockDesktopAnalytics(), custom?: any) => {
    const preloadedState = getInitialState(custom);
    const store = createTestStore({
        extra: { services: { analytics } },
        preloadedState,
        reducer: (state: any, action: any) => ({
            ...state,
            recovery: recoveryReducer(state.recovery, action),
        }),
    });

    return store;
};

// recoveryRerunThunk dispatches its follow-up thunk without awaiting it, so that thunk's side
// effects settle on a later microtask — flush them before asserting on it.
const flushAsyncEffects = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Recovery Thunks', () => {
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation();
    });
    afterAll(() => {
        jest.clearAllMocks();
    });
    beforeEach(() => {
        testMocks.setTrezorConnectFixtures(undefined);
        (TrezorConnect.getFeatures as jest.Mock).mockClear();
        (TrezorConnect.recoveryDevice as jest.Mock).mockClear();
    });

    it('recoverDeviceThunk', async () => {
        const store = initStore();
        const action = store.dispatch(recoverDeviceThunk({ device }));
        expect(store.getState().recovery.status).toMatch('in-progress');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
    });

    it('recoverDeviceThunk waits for on-device confirmation on T1B1', async () => {
        const store = initStore();
        const t1b1Device = mockSuiteDevice(
            { path: '1' },
            { internal_model: DeviceModelInternal.T1B1 },
        ) as AcquiredDevice;
        const action = store.dispatch(recoverDeviceThunk({ device: t1b1Device }));
        expect(store.getState().recovery.status).toMatch('waiting-for-confirmation');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
    });

    it('checkSeedThunk', async () => {
        const analytics = mockDesktopAnalytics();
        const store = initStore(analytics);
        const action = store.dispatch(checkSeedThunk({ device }));
        expect(store.getState().recovery.status).toMatch('in-progress');
        await action;
        expect(store.getState().recovery.status).toMatch('finished');
        expect(analytics.report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.settingsDeviceCheckSeedEvent.name,
                payload: { status: 'finished' },
            }),
        );
    });

    it('recoveryRerunThunk runs recovery against freshly-loaded features when the device is not initialized', async () => {
        // The store device reports initialized: true, but the fresh getFeatures payload says false.
        // Selecting the not-initialized branch proves the follow-up runs against the FRESH features
        // rather than the ones already in the store.
        const analytics = mockDesktopAnalytics();
        const store = initStore(analytics);
        testMocks.setTrezorConnectFixtures([
            {
                success: true,
                payload: mockDeviceFeatures({ recovery_status: 'Recovery', initialized: false }),
            },
        ]);

        const result = await store.dispatch(recoveryRerunThunk());
        await flushAsyncEffects();

        expect(TrezorConnect.getFeatures).toHaveBeenCalledWith({ device: { path: '1' } });
        // recoverDeviceThunk (real recovery) sets passphrase_protection; checkSeedThunk does not.
        expect(TrezorConnect.recoveryDevice).toHaveBeenCalledWith(
            expect.objectContaining({ passphrase_protection: false, device: { path: '1' } }),
        );
        // recoverDeviceThunk does not report analytics — checkSeedThunk would.
        expect(analytics.report).not.toHaveBeenCalled();
        if (!recoveryRerunThunk.fulfilled.match(result)) throw new Error('expected fulfilled');
        expect(result.payload).toEqual({ initialized: false });
    });

    it('recoveryRerunThunk runs seed check against freshly-loaded features when the device is initialized', async () => {
        const analytics = mockDesktopAnalytics();
        const store = initStore(analytics);
        testMocks.setTrezorConnectFixtures([
            {
                success: true,
                payload: mockDeviceFeatures({ recovery_status: 'Recovery', initialized: true }),
            },
        ]);

        const result = await store.dispatch(recoveryRerunThunk());
        await flushAsyncEffects();

        expect(TrezorConnect.getFeatures).toHaveBeenCalledWith({ device: { path: '1' } });
        // checkSeedThunk (seed check) defaults the recovery type to DryRun.
        expect(TrezorConnect.recoveryDevice).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'DryRun', device: { path: '1' } }),
        );
        expect(analytics.report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.settingsDeviceCheckSeedEvent.name,
                payload: { status: 'finished' },
            }),
        );
        if (!recoveryRerunThunk.fulfilled.match(result)) throw new Error('expected fulfilled');
        expect(result.payload).toEqual({ initialized: true });
    });
});
