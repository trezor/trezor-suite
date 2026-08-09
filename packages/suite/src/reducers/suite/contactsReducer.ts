import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type StaticSessionId } from '@trezor/connect';

import { type LabelStoreSnapshot } from 'src/utils/authlabel/labelStore';
import { type Attestation } from 'src/utils/contacts/attestation';

/**
 * Contacts are per-WALLET, not per-device: the identity, the labeling trie, the MAC
 * key and the counter are all derived from seed+passphrase. So everything is keyed
 * by the FULL staticSessionId (never the `split('@')[0]` form, which drops the
 * passphrase component and would merge distinct wallets).
 *
 * staticSessionId is confidential (see CLAUDE.md): it may be a state/IDB key, but it
 * must never reach logs, analytics, Sentry or the relay.
 */
export type Contact = {
    /** 64-char lowercase hex, x-only secp256k1 pubkey (the identity) */
    npub: string;
    label: string;
    addedAt: number;
};

export type ContactsWalletState = {
    /** this wallet's own identity, hex */
    identityNpub?: string;
    /**
     * RIPEMD160(SHA256(pubkey)) reported by the device in AuthLabelState. Stored only
     * as an integrity check: on load it must equal what the device reports, otherwise
     * the persisted record belongs to a different wallet and must be discarded.
     */
    walletId?: string;
    contacts: Record<string, Contact>;
    /**
     * The device-authenticated trie. This is the AUTHORITY; `contacts` above is a
     * denormalised read model of it. Persisting and restoring this is mandatory —
     * see the comment on openStore() in contactsThunks.
     */
    trieSnapshot?: LabelStoreSnapshot;
    /**
     * Addresses proven to belong to a contact, keyed by address. These carry no
     * device authority by themselves — they are a cache of a signature that is
     * re-verified by the device before it matters (at signing time).
     */
    verifiedAddresses: Record<string, Attestation>;
};

export type ContactsState = {
    byWallet: Partial<Record<StaticSessionId, ContactsWalletState>>;
};

export const emptyWalletState: ContactsWalletState = { contacts: {}, verifiedAddresses: {} };

const initialState: ContactsState = { byWallet: {} };

type WalletScoped<T> = { deviceState: StaticSessionId } & T;

const contactsSlice = createSlice({
    name: '@suite/contacts',
    initialState,
    reducers: {
        identityLoaded: (
            state,
            { payload }: PayloadAction<WalletScoped<{ identityNpub: string; walletId?: string }>>,
        ) => {
            const wallet = (state.byWallet[payload.deviceState] ??= { ...emptyWalletState });
            wallet.identityNpub = payload.identityNpub;
            if (payload.walletId !== undefined) wallet.walletId = payload.walletId;
        },
        contactUpserted: (
            state,
            { payload }: PayloadAction<WalletScoped<{ contact: Contact }>>,
        ) => {
            const wallet = (state.byWallet[payload.deviceState] ??= { ...emptyWalletState });
            wallet.contacts[payload.contact.npub] = payload.contact;
        },
        contactRemoved: (state, { payload }: PayloadAction<WalletScoped<{ npub: string }>>) => {
            const wallet = state.byWallet[payload.deviceState];
            if (wallet) delete wallet.contacts[payload.npub];
        },
        addressVerified: (
            state,
            { payload }: PayloadAction<WalletScoped<{ attestation: Attestation }>>,
        ) => {
            const wallet = (state.byWallet[payload.deviceState] ??= { ...emptyWalletState });
            wallet.verifiedAddresses ??= {};
            wallet.verifiedAddresses[payload.attestation.address] = payload.attestation;
        },
        trieSnapshotUpdated: (
            state,
            { payload }: PayloadAction<WalletScoped<{ snapshot: LabelStoreSnapshot }>>,
        ) => {
            const wallet = (state.byWallet[payload.deviceState] ??= { ...emptyWalletState });
            wallet.trieSnapshot = payload.snapshot;
            wallet.walletId = payload.snapshot.walletId;
        },
    },
});

export const contactsActions = contactsSlice.actions;

export default contactsSlice.reducer;
