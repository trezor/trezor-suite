import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { debugActions, debugInitialState, prepareDebugReducer } from '@suite/debug';
import { type ExperimentalFeature } from '@suite/experimental';
import {
    prepareSuiteSettingsReducer,
    suiteSettingsActions,
    suiteSettingsInitialState,
} from '@suite/settings';
import { deviceActions, deviceInitialState, prepareDeviceReducer } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { accountsActions, prepareAccountsReducer } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import {
    type ContactsWalletState,
    contactsActions,
    contactsReducer,
    createEmptyWalletState,
} from 'src/reducers/suite/contactsReducer';
import { syncDesktopRelayAllowlist } from 'src/services/nostr/desktopRelayAllowlist';
import {
    disposeAllRelayPools,
    disposeRelayPoolsExcept,
    reconcileRelayPool,
} from 'src/services/nostr/relayPool';
import { ATTESTATION_KIND } from 'src/utils/contacts/attestation';

import { contactsRelayMiddleware } from './contactsRelayMiddleware';
import { contactsSharedAddressMiddleware } from './contactsSharedAddressMiddleware';

jest.mock('src/services/nostr/relayPool');
jest.mock('src/services/nostr/desktopRelayAllowlist');

const mockReconcileRelayPool = jest.mocked(reconcileRelayPool);
const mockDisposeAllRelayPools = jest.mocked(disposeAllRelayPools);
const mockDisposeRelayPoolsExcept = jest.mocked(disposeRelayPoolsExcept);
const mockSyncDesktopRelayAllowlist = jest.mocked(syncDesktopRelayAllowlist);

const WALLET_A: StaticSessionId = 'walletA@deviceid:0';
// The standard wallet of another remembered device.
const WALLET_B: StaticSessionId = 'walletB@otherdeviceid:0';
// A passphrase wallet of the first device.
const WALLET_HIDDEN: StaticSessionId = 'walletH@deviceid:1';
const NPUB_A = 'a'.repeat(64);
const NPUB_B = 'b'.repeat(64);
const NPUB_HIDDEN = 'c'.repeat(64);
const RELAY_URL = 'wss://relay.example.com';

const mockRememberedWallet = (staticSessionId: StaticSessionId) =>
    mockSuiteDevice({
        id: staticSessionId.split('@')[1]?.split(':')[0],
        connected: true,
        remember: true,
        instance: staticSessionId === WALLET_HIDDEN ? 1 : undefined,
        useEmptyPassphrase: staticSessionId !== WALLET_HIDDEN,
        state: { staticSessionId, sessionId: 'session-1' },
    });

const DEVICES = [WALLET_A, WALLET_B, WALLET_HIDDEN].map(mockRememberedWallet);

const selectWallet = (staticSessionId: StaticSessionId) =>
    deviceActions.selectDevice(
        DEVICES.find(device => device.state?.staticSessionId === staticSessionId),
    );

type CreateStoreParams = {
    experimental: ExperimentalFeature[];
    isDebugModeActive: boolean;
    walletA?: ContactsWalletState;
    accounts?: Account[];
};

const createStore = ({
    experimental,
    isDebugModeActive,
    walletA = { ...createEmptyWalletState(), identityNpub: NPUB_A },
    accounts = [],
}: CreateStoreParams) =>
    configureStore({
        reducer: {
            contacts: contactsReducer,
            suiteSettings: prepareSuiteSettingsReducer(extraDependenciesCommonMock),
            debug: prepareDebugReducer(extraDependenciesCommonMock),
            device: prepareDeviceReducer(extraDependenciesCommonMock),
            wallet: combineReducers({
                accounts: prepareAccountsReducer(extraDependenciesCommonMock),
            }),
        },
        preloadedState: {
            contacts: {
                byWallet: { [WALLET_A]: walletA },
                deviceAuthority: {},
                relay: { isConnected: false },
            },
            suiteSettings: {
                ...suiteSettingsInitialState,
                experimental,
                contactsRelayUrls: [RELAY_URL],
            },
            debug: { ...debugInitialState, showDebugMenu: isDebugModeActive },
            device: { ...deviceInitialState, devices: DEVICES, selectedDevice: DEVICES[0] },
            wallet: { accounts },
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware().concat(contactsRelayMiddleware, contactsSharedAddressMiddleware),
    });

// The relay sync awaits the desktop allowlist before it opens pools.
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const getReconciledWallets = () =>
    mockReconcileRelayPool.mock.calls.map(([{ deviceState }]) => deviceState);

describe('contactsRelayMiddleware', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockSyncDesktopRelayAllowlist.mockResolvedValue();
    });

    it('starts the relay pools with the feature and stops them when debug mode is left', async () => {
        const store = createStore({ experimental: [], isDebugModeActive: true });

        store.dispatch(suiteSettingsActions.setExperimentalFeatures(['contacts']));
        await flushPromises();

        expect(mockSyncDesktopRelayAllowlist).toHaveBeenLastCalledWith([RELAY_URL]);
        expect(getReconciledWallets()).toEqual([WALLET_A]);

        jest.clearAllMocks();
        store.dispatch(debugActions.setShowDebugMenu(false));
        await flushPromises();

        expect(mockDisposeAllRelayPools).toHaveBeenCalled();
        expect(mockSyncDesktopRelayAllowlist).toHaveBeenLastCalledWith([]);
        expect(mockReconcileRelayPool).not.toHaveBeenCalled();
    });

    it('does no relay work while the feature is off', async () => {
        const store = createStore({ experimental: ['contacts'], isDebugModeActive: false });

        store.dispatch(
            contactsActions.identityLoaded({ deviceState: WALLET_B, identityNpub: NPUB_B }),
        );
        store.dispatch(suiteSettingsActions.setContactsRelayUrls([RELAY_URL]));
        await flushPromises();

        expect(mockReconcileRelayPool).not.toHaveBeenCalled();
        expect(mockSyncDesktopRelayAllowlist).not.toHaveBeenCalled();
    });

    it('brings the pools in line with a newly loaded identity while the feature is on', async () => {
        const store = createStore({ experimental: ['contacts'], isDebugModeActive: true });

        store.dispatch(
            contactsActions.identityLoaded({ deviceState: WALLET_B, identityNpub: NPUB_B }),
        );
        await flushPromises();

        expect(getReconciledWallets()).toEqual([WALLET_A, WALLET_B]);
    });

    it('keeps the pool of a passphrase wallet open only while it is selected', async () => {
        const store = createStore({ experimental: ['contacts'], isDebugModeActive: true });
        store.dispatch(
            contactsActions.identityLoaded({
                deviceState: WALLET_HIDDEN,
                identityNpub: NPUB_HIDDEN,
            }),
        );
        store.dispatch(
            contactsActions.identityLoaded({ deviceState: WALLET_B, identityNpub: NPUB_B }),
        );
        await flushPromises();

        expect(mockDisposeRelayPoolsExcept).toHaveBeenLastCalledWith(new Set([WALLET_A, WALLET_B]));
        expect(getReconciledWallets()).not.toContain(WALLET_HIDDEN);

        // Its new pool receives the relays' replay of what it missed.
        jest.clearAllMocks();
        store.dispatch(selectWallet(WALLET_HIDDEN));
        await flushPromises();

        expect(mockDisposeRelayPoolsExcept).toHaveBeenLastCalledWith(
            new Set([WALLET_A, WALLET_B, WALLET_HIDDEN]),
        );
        expect(mockReconcileRelayPool).toHaveBeenCalledWith(
            expect.objectContaining({
                deviceState: WALLET_HIDDEN,
                subscription: expect.objectContaining({ urls: [RELAY_URL] }),
            }),
        );

        store.dispatch(selectWallet(WALLET_A));
        await flushPromises();

        expect(mockDisposeRelayPoolsExcept).toHaveBeenLastCalledWith(new Set([WALLET_A, WALLET_B]));
    });

    it('marks the shared addresses used while the feature was off before the pools open', async () => {
        const sharedAddress = 'bc1qshared0000000000000000000000000000000';
        const account = mockWalletAccount({ symbol: 'btc', deviceState: WALLET_A });
        const store = createStore({
            experimental: [],
            isDebugModeActive: true,
            walletA: {
                ...createEmptyWalletState(),
                identityNpub: NPUB_A,
                sharedAddresses: {
                    [sharedAddress]: {
                        npub: NPUB_B,
                        attestation: {
                            npub: NPUB_A,
                            address: sharedAddress,
                            slip44: 0,
                            createdAt: 1,
                            kind: ATTESTATION_KIND,
                            signature: 'd'.repeat(128),
                            eventId: 'e'.repeat(64),
                        },
                        sharedAt: 1,
                    },
                },
            },
            accounts: [account],
        });

        store.dispatch(
            accountsActions.updateAccount({
                ...account,
                addresses: {
                    used: [
                        {
                            address: sharedAddress,
                            path: "m/84'/0'/0'/0/0",
                            transfers: 1,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                    unused: [],
                    change: [],
                },
            }),
        );

        expect(store.getState().contacts.byWallet[WALLET_A]?.spentSharedAddresses).toEqual({});

        store.dispatch(suiteSettingsActions.setExperimentalFeatures(['contacts']));
        await flushPromises();

        expect(store.getState().contacts.byWallet[WALLET_A]?.spentSharedAddresses).toEqual({
            [sharedAddress]: true,
        });
        expect(getReconciledWallets()).toEqual([WALLET_A]);
    });
});
