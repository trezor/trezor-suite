import { combineReducers } from '@reduxjs/toolkit';

import { type AnalyticsDep, type AnalyticsSharedEvents } from '@suite-common/analytics';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { type DeviceUniquePath } from '@trezor/connect';
import { type WithServices } from '@trezor/redux-utils';

import { discoveryActions } from './discoveryActions';
import { prepareDiscoveryReducer } from './discoveryReducer';
import {
    type UpdateDiscoveryThunkState,
    deleteDiscoveryThunk,
    updateDiscoveryThunk,
} from './discoveryStateThunks';
import { type DiscoveryRootState } from './discoveryTypes';

const discoveryReducer = prepareDiscoveryReducer(undefined);

type InitStoreArgs = {
    preloadedState?: DiscoveryRootState;
};

const initStore = ({ preloadedState }: InitStoreArgs = {}) =>
    createTestCompositionRoot<WithServices<AnalyticsDep>, UpdateDiscoveryThunkState>({
        services: () => ({ analytics: mockAnalytics<AnalyticsSharedEvents>() }),
        reducer: {
            wallet: combineReducers({
                discovery: discoveryReducer,
                accounts: (state: Account[] = []) => state,
            }),
        },
        preloadedState: preloadedState && {
            wallet: { ...preloadedState.wallet, accounts: [] },
        },
    }).services.store;

const TEST_DEVICE_PATH = 'device-id:1' as DeviceUniquePath;
const TEST_DEVICE_PATH_2 = 'device-id:2' as DeviceUniquePath;

describe('Discovery Reducer', () => {
    it('should have initial state', () => {
        const store = initStore();
        expect(store.getState().wallet.discovery).toEqual({});
    });

    it('should handle startDiscovery action', () => {
        const store = initStore();
        const timestamp = Date.now();
        jest.spyOn(Date, 'now').mockImplementation(() => timestamp);

        store.dispatch(
            discoveryActions.startDiscovery(TEST_DEVICE_PATH, { trigger: 'device-connect' }),
        );

        expect(store.getState().wallet.discovery).toEqual({
            [TEST_DEVICE_PATH]: {
                status: 'starting',
                trigger: 'device-connect',
                isAddingHiddenWallet: undefined,
                isAddingExistingWallet: undefined,
                startTimestamp: timestamp,
            },
        });

        // Cleanup mock
        jest.restoreAllMocks();
    });

    it('should handle startDiscovery action with additional flags', () => {
        const store = initStore();
        const timestamp = Date.now();
        jest.spyOn(Date, 'now').mockImplementation(() => timestamp);

        store.dispatch(
            discoveryActions.startDiscovery(TEST_DEVICE_PATH, {
                trigger: 'add-wallet',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: true,
            }),
        );

        expect(store.getState().wallet.discovery).toEqual({
            [TEST_DEVICE_PATH]: {
                status: 'starting',
                trigger: 'add-wallet',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: true,
                startTimestamp: timestamp,
            },
        });

        // Cleanup mock
        jest.restoreAllMocks();
    });

    it('should handle updateDiscovery action', () => {
        // Initialize store with existing discovery
        const store = initStore({
            preloadedState: {
                wallet: {
                    discovery: {
                        [TEST_DEVICE_PATH]: {
                            status: 'starting',
                            startTimestamp: 1000,
                        },
                    },
                },
            },
        });

        // Update to enter-passphrase status
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'enter-passphrase' },
                path: TEST_DEVICE_PATH,
            }),
        );

        expect(store.getState().wallet.discovery[TEST_DEVICE_PATH]).toEqual({
            status: 'enter-passphrase',
            startTimestamp: 1000,
            hasLoadedAnyNonEmptyAccount: undefined,
            passphraseSubmitted: undefined,
        });
    });

    it('should handle updateDiscovery action with progress status', () => {
        // Initialize store with existing discovery
        const store = initStore({
            preloadedState: {
                wallet: {
                    discovery: {
                        [TEST_DEVICE_PATH]: {
                            status: 'starting',
                            startTimestamp: 1000,
                        },
                    },
                },
            },
        });

        // Update to progress status
        store.dispatch(
            updateDiscoveryThunk({
                status: {
                    status: 'progress',
                    total: 10,
                    progress: 5,
                    hasLoadedAnyNonEmptyAccount: true,
                },
                path: TEST_DEVICE_PATH,
            }),
        );

        expect(store.getState().wallet.discovery[TEST_DEVICE_PATH]).toEqual({
            status: 'progress',
            startTimestamp: 1000,
            total: 10,
            progress: 5,
            hasLoadedAnyNonEmptyAccount: true,
            passphraseSubmitted: undefined,
        });
    });

    it('keeps the trigger of the run across status updates', () => {
        const store = initStore({
            preloadedState: {
                wallet: {
                    discovery: {
                        [TEST_DEVICE_PATH]: {
                            status: 'starting',
                            startTimestamp: 1000,
                            trigger: 'retry',
                        },
                    },
                },
            },
        });

        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'progress', total: 10, progress: 5 },
                path: TEST_DEVICE_PATH,
            }),
        );
        store.dispatch(
            updateDiscoveryThunk({ status: { status: 'complete' }, path: TEST_DEVICE_PATH }),
        );

        expect(store.getState().wallet.discovery[TEST_DEVICE_PATH]).toEqual(
            expect.objectContaining({ status: 'complete', trigger: 'retry' }),
        );
    });

    it('should handle updateDiscovery action with passphraseSubmitted flag', () => {
        // Initialize store with existing discovery
        const store = initStore({
            preloadedState: {
                wallet: {
                    discovery: {
                        [TEST_DEVICE_PATH]: {
                            status: 'enter-passphrase',
                            startTimestamp: 1000,
                        },
                    },
                },
            },
        });

        // Update with passphraseSubmitted flag
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'enter-passphrase', passphraseSubmitted: true },
                path: TEST_DEVICE_PATH,
            }),
        );

        expect(store.getState().wallet.discovery[TEST_DEVICE_PATH]).toEqual({
            status: 'enter-passphrase',
            startTimestamp: 1000,
            hasLoadedAnyNonEmptyAccount: undefined,
            passphraseSubmitted: true,
        });
    });

    it('should handle updateDiscovery action with status change and passphraseSubmitted flag', () => {
        // Initialize store with existing discovery
        const store = initStore({
            preloadedState: {
                wallet: {
                    discovery: {
                        [TEST_DEVICE_PATH]: {
                            status: 'enter-passphrase',
                            passphraseSubmitted: true,
                            startTimestamp: 1000,
                        },
                    },
                },
            },
        });

        // Update with status change and passphraseSubmitted flag
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'progress', total: 10, progress: 0, passphraseSubmitted: true },
                path: TEST_DEVICE_PATH,
            }),
        );

        // When status changes, passphraseSubmitted should be set to the new value
        expect(store.getState().wallet.discovery[TEST_DEVICE_PATH]).toEqual({
            status: 'progress',
            startTimestamp: 1000,
            total: 10,
            progress: 0,
            hasLoadedAnyNonEmptyAccount: undefined,
            passphraseSubmitted: undefined,
        });
    });

    it('should not update non-existent discovery', () => {
        const store = initStore();

        // Try to update non-existent discovery
        store.dispatch(
            updateDiscoveryThunk({
                status: { status: 'enter-passphrase' },
                path: TEST_DEVICE_PATH,
            }),
        );

        // State should remain unchanged
        expect(store.getState().wallet.discovery).toEqual({});
    });

    it('should handle deleteDiscovery action', () => {
        // Initialize store with multiple discoveries
        const store = initStore({
            preloadedState: {
                wallet: {
                    discovery: {
                        [TEST_DEVICE_PATH]: {
                            status: 'complete',
                            startTimestamp: 1000,
                        },
                        [TEST_DEVICE_PATH_2]: {
                            status: 'starting',
                            startTimestamp: 2000,
                        },
                    },
                },
            },
        });

        // Delete one discovery
        store.dispatch(deleteDiscoveryThunk(TEST_DEVICE_PATH));

        // Only the specified discovery should be deleted
        expect(store.getState().wallet.discovery).toEqual({
            [TEST_DEVICE_PATH_2]: {
                status: 'starting',
                startTimestamp: 2000,
            },
        });
    });

    it('should handle deleteDiscovery action for non-existent path', () => {
        // Initialize store with one discovery
        const store = initStore({
            preloadedState: {
                wallet: {
                    discovery: {
                        [TEST_DEVICE_PATH]: {
                            status: 'complete',
                            startTimestamp: 1000,
                        },
                    },
                },
            },
        });

        // Try to delete non-existent discovery
        store.dispatch(deleteDiscoveryThunk('non-existent-path' as DeviceUniquePath));

        // State should remain unchanged
        expect(store.getState().wallet.discovery).toEqual({
            [TEST_DEVICE_PATH]: {
                status: 'complete',
                startTimestamp: 1000,
            },
        });
    });

    it('should handle updateDiscovery action with errored status', () => {
        // Initialize store with existing discovery
        const store = initStore({
            preloadedState: {
                wallet: {
                    discovery: {
                        [TEST_DEVICE_PATH]: {
                            status: 'progress',
                            total: 10,
                            progress: 5,
                            startTimestamp: 1000,
                        },
                    },
                },
            },
        });

        // Update to failed status with error
        store.dispatch(
            updateDiscoveryThunk({
                status: {
                    status: 'failed',
                    error: 'Connection error',
                    errorCode: 'Method_InvalidParameter',
                },
                path: TEST_DEVICE_PATH,
            }),
        );

        expect(store.getState().wallet.discovery[TEST_DEVICE_PATH]).toEqual({
            status: 'failed',
            error: 'Connection error',
            errorCode: 'Method_InvalidParameter',
            startTimestamp: 1000,
            progress: 5,
            total: 10,
            hasLoadedAnyNonEmptyAccount: undefined,
            passphraseSubmitted: undefined,
        });
    });
});
