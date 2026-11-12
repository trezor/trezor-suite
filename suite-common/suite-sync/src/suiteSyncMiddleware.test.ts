import { configureStore } from '@reduxjs/toolkit';

import {
    DeviceCancelledErr,
    DeviceNotConnectedError,
    deviceActions,
    deviceReducerInitialState,
    selectDeviceThunk,
} from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { createMockDeps } from '@trezor/dependency-injection';

import {
    type SuiteSyncMiddlewareDeps,
    type SuiteSyncMiddlewareState,
    prepareSuiteSyncMiddleware,
} from './suiteSyncMiddleware';
import { type SuiteSyncErrorType, initialSuiteSyncState } from './suiteSyncSlice';

const DEVICE_STATIC_SESSION_ID: StaticSessionId = '1@2:3';

type SetupParams = {
    connected: boolean;
    error: SuiteSyncErrorType;
};

const setup = ({ connected, error }: SetupParams) => {
    const device = mockSuiteDevice({
        connected,
        discovered: true,
        state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
    });
    const preloadedState: SuiteSyncMiddlewareState = {
        device: { ...deviceReducerInitialState, devices: [device] },
        suiteSync: {
            ...initialSuiteSyncState,
            settings: { ...initialSuiteSyncState.settings, isSuiteSyncEnabled: true },
            suiteSyncErrors: { [DEVICE_STATIC_SESSION_ID]: error },
        },
        messageSystem: messageSystemInitialState,
    };
    const services = createMockDeps<SuiteSyncMiddlewareDeps['services']>({
        suiteSync: {
            changeRelayUrl: null,
            disconnectAllRelays: null,
            reconnectAllRelays: null,
            turnOnSuiteSync: null,
            turnOffSuiteSync: null,
            ensureWalletSuiteSyncOn: null,
            ensureWalletSuiteSyncOnUncontrolled: () => Promise.resolve(),
            dangerouslyWipeAllLabelsFromWallet: null,
            turnOffSuiteSyncForWallet: null,
            labeling: {
                updateWalletLabel: null,
                updateAccountLabel: null,
                updateAddressLabel: null,
                updateOutputLabel: null,
            },
        },
    });
    const store = configureStore({
        reducer: (state: SuiteSyncMiddlewareState = preloadedState) => state,
        preloadedState,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware().concat(prepareSuiteSyncMiddleware(() => ({ services }))),
    });

    return {
        store,
        device,
        ensureWalletSuiteSyncOnUncontrolled: services.suiteSync.ensureWalletSuiteSyncOnUncontrolled,
    };
};

describe(prepareSuiteSyncMiddleware.name, () => {
    it('retries a wallet whose device was disconnected once the device is selected connected', () => {
        const { store, device, ensureWalletSuiteSyncOnUncontrolled } = setup({
            connected: true,
            error: DeviceNotConnectedError(),
        });

        store.dispatch(selectDeviceThunk.fulfilled({ device }, 'request-id', { device }));

        expect(ensureWalletSuiteSyncOnUncontrolled).toHaveBeenCalledWith({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID,
            isWriteMode: false,
        });
    });

    it('retries a wallet whose device was disconnected once its discovery finishes', () => {
        const { store, ensureWalletSuiteSyncOnUncontrolled } = setup({
            connected: true,
            error: DeviceNotConnectedError(),
        });

        store.dispatch(deviceActions.setDiscovered(DEVICE_STATIC_SESSION_ID, true));

        expect(ensureWalletSuiteSyncOnUncontrolled).toHaveBeenCalledTimes(1);
    });

    it('does not retry while the device is still disconnected', () => {
        const { store, device, ensureWalletSuiteSyncOnUncontrolled } = setup({
            connected: false,
            error: DeviceNotConnectedError(),
        });

        store.dispatch(selectDeviceThunk.fulfilled({ device }, 'request-id', { device }));

        expect(ensureWalletSuiteSyncOnUncontrolled).not.toHaveBeenCalled();
    });

    it('does not retry a wallet whose request was cancelled on the device', () => {
        const { store, device, ensureWalletSuiteSyncOnUncontrolled } = setup({
            connected: true,
            error: DeviceCancelledErr(),
        });

        store.dispatch(selectDeviceThunk.fulfilled({ device }, 'request-id', { device }));

        expect(ensureWalletSuiteSyncOnUncontrolled).not.toHaveBeenCalled();
    });
});
