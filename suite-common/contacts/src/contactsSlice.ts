import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type StaticSessionId } from '@trezor/connect';

/**
 * What the Trezor did with the last contact write from this Suite: `written` means it is in the
 * WARD, `queued` that the Trezor holds the change until the WARD Manager confirms it.
 */
export type ContactWardStatus = 'written' | 'queued';

export type ContactsWalletState = {
    /** The wallet's own contact identity, `npub1…`, as its Trezor returned it. */
    identityNpub?: string;
    /** The ward_id the Trezor reported for the wallet; every later WARD call is pinned to it. */
    wardId?: string;
    /** By npub; only this session's writes, the WARD itself is the record. */
    wardStatuses: Record<string, ContactWardStatus>;
};

export type ContactsState = {
    wallets: Partial<Record<StaticSessionId, ContactsWalletState>>;
};

export type ContactsRootState = {
    contacts: ContactsState;
};

type WalletPayload = { staticSessionId: StaticSessionId };

export const contactsInitialState: ContactsState = {
    wallets: {},
};

const getWallet = (state: ContactsState, staticSessionId: StaticSessionId) => {
    const wallet = state.wallets[staticSessionId] ?? { wardStatuses: {} };
    state.wallets[staticSessionId] = wallet;

    return wallet;
};

const contactsSlice = createSlice({
    name: 'contacts',
    initialState: contactsInitialState,
    reducers: {
        setIdentityNpub: (
            state: ContactsState,
            { payload }: PayloadAction<WalletPayload & { npub: string }>,
        ) => {
            getWallet(state, payload.staticSessionId).identityNpub = payload.npub;
        },
        setWardId: (
            state: ContactsState,
            { payload }: PayloadAction<WalletPayload & { wardId: string }>,
        ) => {
            getWallet(state, payload.staticSessionId).wardId = payload.wardId;
        },
        clearWardId: (state: ContactsState, { payload }: PayloadAction<WalletPayload>) => {
            delete getWallet(state, payload.staticSessionId).wardId;
        },
        setWardStatus: (
            state: ContactsState,
            {
                payload,
            }: PayloadAction<
                WalletPayload & { npub: string; status: ContactWardStatus | undefined }
            >,
        ) => {
            const { wardStatuses } = getWallet(state, payload.staticSessionId);

            if (payload.status === undefined) {
                delete wardStatuses[payload.npub];
            } else {
                wardStatuses[payload.npub] = payload.status;
            }
        },
    },
});

export const contactsActions = contactsSlice.actions;
export const contactsReducer = contactsSlice.reducer;

export const selectContactsIdentityNpub = (
    state: ContactsRootState,
    staticSessionId: StaticSessionId,
) => state.contacts.wallets[staticSessionId]?.identityNpub;

export const selectContactsWardId = (state: ContactsRootState, staticSessionId: StaticSessionId) =>
    state.contacts.wallets[staticSessionId]?.wardId;

const EMPTY_WARD_STATUSES: Record<string, ContactWardStatus> = {};

/** By npub; see `selectContactWardStatus`. */
export const selectContactWardStatuses = (
    state: ContactsRootState,
    staticSessionId: StaticSessionId,
): Record<string, ContactWardStatus> =>
    state.contacts.wallets[staticSessionId]?.wardStatuses ?? EMPTY_WARD_STATUSES;

export const selectContactWardStatus = (
    state: ContactsRootState,
    staticSessionId: StaticSessionId,
    npub: string,
): ContactWardStatus | undefined => state.contacts.wallets[staticSessionId]?.wardStatuses[npub];
