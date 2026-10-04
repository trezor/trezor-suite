import { configureStore } from '@reduxjs/toolkit';

import { debugInitialState, prepareDebugReducer } from '@suite/debug';
import { type ExperimentalFeature } from '@suite/experimental';
import { prepareSuiteSettingsReducer, suiteSettingsInitialState } from '@suite/settings';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { accountsActions } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/connect';

import {
    type ContactsWalletState,
    contactsReducer,
    createEmptyWalletState,
} from 'src/reducers/suite/contactsReducer';
import { publishDraftToPool } from 'src/services/nostr/relayPool';
import { ATTESTATION_KIND, type Attestation } from 'src/utils/contacts/attestation';

import { contactsSharedAddressMiddleware } from './contactsSharedAddressMiddleware';

jest.mock('src/services/nostr/relayPool');

const mockPublishDraftToPool = jest.mocked(publishDraftToPool);

// The update arrives for a wallet while no device is selected, as for a wallet in the background.
const WALLET_B: StaticSessionId = 'walletdescb@c4d10fab:0';
const CONTACT_NPUB = 'c'.repeat(64);
const OWN_NPUB = 'a'.repeat(64);
const ADDRESS_USED = 'bc1qused00000000000000000000000000000000';
const ADDRESS_FRESH = 'bc1qfresh0000000000000000000000000000000';
const CONTACTS_FEATURE: ExperimentalFeature[] = ['contacts'];

const attestation = (address: string): Attestation => ({
    npub: OWN_NPUB,
    address,
    slip44: 0,
    createdAt: 1,
    kind: ATTESTATION_KIND,
    signature: 'd'.repeat(128),
    eventId: 'e'.repeat(64),
});

const walletBState = (): ContactsWalletState => ({
    ...createEmptyWalletState(),
    identityNpub: OWN_NPUB,
    contacts: {
        [CONTACT_NPUB]: { npub: CONTACT_NPUB, label: 'C', addedAt: 1, isVerified: true },
    },
    // One share was used on-chain, which triggers the top-up; the other is what gets re-sent.
    sharedAddresses: {
        [ADDRESS_USED]: { npub: CONTACT_NPUB, attestation: attestation(ADDRESS_USED), sharedAt: 1 },
        [ADDRESS_FRESH]: {
            npub: CONTACT_NPUB,
            attestation: attestation(ADDRESS_FRESH),
            sharedAt: 2,
        },
    },
});

const createStore = ({ isFeatureEnabled }: { isFeatureEnabled: boolean }) =>
    configureStore({
        reducer: {
            contacts: contactsReducer,
            suiteSettings: prepareSuiteSettingsReducer(extraDependenciesCommonMock),
            debug: prepareDebugReducer(extraDependenciesCommonMock),
        },
        preloadedState: {
            contacts: {
                byWallet: { [WALLET_B]: walletBState() },
                deviceAuthority: {},
                relay: { isConnected: false },
            },
            suiteSettings: {
                ...suiteSettingsInitialState,
                experimental: isFeatureEnabled ? CONTACTS_FEATURE : [],
            },
            debug: { ...debugInitialState, showDebugMenu: true },
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware().concat(contactsSharedAddressMiddleware),
    });

const updateAccountOfWalletB = () =>
    accountsActions.updateAccount(
        mockWalletAccount({
            symbol: 'btc',
            deviceState: WALLET_B,
            addresses: {
                used: [
                    {
                        address: ADDRESS_USED,
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

// The middleware hands the update to a thunk.
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('contactsSharedAddressMiddleware', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("tops up the contact from the account's own wallet, not the selected one", async () => {
        const store = createStore({ isFeatureEnabled: true });

        store.dispatch(updateAccountOfWalletB());
        await flushPromises();

        expect(store.getState().contacts.byWallet[WALLET_B]?.spentSharedAddresses).toEqual({
            [ADDRESS_USED]: true,
        });
        expect(mockPublishDraftToPool).toHaveBeenCalledTimes(1);

        const [deviceState, draft] = mockPublishDraftToPool.mock.calls[0] ?? [];
        expect(deviceState).toBe(WALLET_B);
        expect(draft?.content).toContain(ADDRESS_FRESH);
        expect(draft?.content).not.toContain(ADDRESS_USED);
        expect(draft?.tags).toEqual([['p', CONTACT_NPUB]]);
    });

    it('does nothing while the contacts feature is off', async () => {
        const store = createStore({ isFeatureEnabled: false });

        store.dispatch(updateAccountOfWalletB());
        await flushPromises();

        expect(store.getState().contacts.byWallet[WALLET_B]?.spentSharedAddresses).toEqual({});
        expect(mockPublishDraftToPool).not.toHaveBeenCalled();
    });
});
