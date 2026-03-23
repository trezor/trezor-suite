import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type DeviceUniquePath } from '@trezor/connect';

import { discoveryActions } from '../discoveryActions';
import { type DiscoveryRootState, prepareDiscoveryReducer } from '../discoveryReducer';

const discoveryReducer = prepareDiscoveryReducer(extraDependenciesCommonMock);

type InitStoreArgs = {
    preloadedState?: DiscoveryRootState;
};

const initStore = ({ preloadedState }: InitStoreArgs = {}) => {
    const store = configureMockStore({
        reducer: { wallet: combineReducers({ discovery: discoveryReducer }) },
        preloadedState,
    });

    return store;
};

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

        store.dispatch(discoveryActions.startDiscovery(TEST_DEVICE_PATH));

        expect(store.getState().wallet.discovery).toEqual({
            [TEST_DEVICE_PATH]: {
                status: 'starting',
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
                isAddingHiddenWallet: true,
                isAddingExistingWallet: true,
            }),
        );

        expect(store.getState().wallet.discovery).toEqual({
            [TEST_DEVICE_PATH]: {
                status: 'starting',
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
            discoveryActions.updateDiscovery(
                {
                    status: 'enter-passphrase',
                },
                TEST_DEVICE_PATH,
            ),
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
            discoveryActions.updateDiscovery(
                {
                    status: 'progress',
                    total: 10,
                    progress: 5,
                    hasLoadedAnyNonEmptyAccount: true,
                },
                TEST_DEVICE_PATH,
            ),
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
            discoveryActions.updateDiscovery(
                {
                    status: 'enter-passphrase',
                    passphraseSubmitted: true,
                },
                TEST_DEVICE_PATH,
            ),
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
            discoveryActions.updateDiscovery(
                {
                    status: 'progress',
                    total: 10,
                    progress: 0,
                    passphraseSubmitted: true,
                },
                TEST_DEVICE_PATH,
            ),
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
            discoveryActions.updateDiscovery(
                {
                    status: 'enter-passphrase',
                },
                TEST_DEVICE_PATH,
            ),
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
        store.dispatch(discoveryActions.deleteDiscovery(TEST_DEVICE_PATH));

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
        store.dispatch(discoveryActions.deleteDiscovery('non-existent-path' as DeviceUniquePath));

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
            discoveryActions.updateDiscovery(
                {
                    status: 'failed',
                    error: 'Connection error',
                    errorCode: 'Method_InvalidParameter',
                },
                TEST_DEVICE_PATH,
            ),
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
