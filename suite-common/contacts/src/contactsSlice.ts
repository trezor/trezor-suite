import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type StaticSessionId } from '@trezor/connect';

/**
 * What the Trezor did with the last contact write from this Suite: `written` means it is in the
 * WARD, `queued` that the Trezor holds the change until the WARD Manager confirms it.
 */
export type ContactWardStatus = 'written' | 'queued';

/** The wallet's inbox on the nostr relays, while it is open. */
export type ContactsMessagingState = {
    relayCount: number;
    connectedRelayCount: number;
    /** Whether contacts find the wallet's hot key by its npub; unknown until the relays answer. */
    isHotKeyAttested?: boolean;
};

/** A contact's request for an address of the wallet. */
export type ContactAddressRequest = {
    /** The requester's npub, as the request names it; nothing proves it. */
    npub: string;
    slip44: number;
    /** When the newest request was sent, by the requester's clock, in seconds. */
    requestedAt: number;
    /** `requestedAt` of the request the wallet answered or dismissed last. */
    handledAt?: number;
};

export type ContactsWalletState = {
    /** The wallet's own contact identity, `npub1…`, as its Trezor returned it. */
    identityNpub?: string;
    /** The ward_id the Trezor reported for the wallet; every later WARD call is pinned to it. */
    wardId?: string;
    /** By npub; only this session's writes, the WARD itself is the record. */
    wardStatuses: Record<string, ContactWardStatus>;
    messaging?: ContactsMessagingState;
    /** One per requester and network; this session only, the relays replay the rest. */
    addressRequests?: ContactAddressRequest[];
};

export type ContactsState = {
    wallets: Partial<Record<StaticSessionId, ContactsWalletState>>;
};

export type ContactsRootState = {
    contacts: ContactsState;
};

type WalletPayload = { staticSessionId: StaticSessionId };

type AddressRequestPayload = WalletPayload & Pick<ContactAddressRequest, 'npub' | 'slip44'>;

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
        setMessaging: (
            state: ContactsState,
            {
                payload,
            }: PayloadAction<WalletPayload & { messaging: ContactsMessagingState | undefined }>,
        ) => {
            getWallet(state, payload.staticSessionId).messaging = payload.messaging;
        },
        setMessagingRelayStatus: (
            state: ContactsState,
            { payload }: PayloadAction<WalletPayload & { connectedRelayCount: number }>,
        ) => {
            const { messaging } = getWallet(state, payload.staticSessionId);

            if (messaging) messaging.connectedRelayCount = payload.connectedRelayCount;
        },
        setHotKeyAttested: (
            state: ContactsState,
            { payload }: PayloadAction<WalletPayload & { isHotKeyAttested: boolean }>,
        ) => {
            const { messaging } = getWallet(state, payload.staticSessionId);

            if (messaging) messaging.isHotKeyAttested = payload.isHotKeyAttested;
        },
        receiveAddressRequest: (
            state: ContactsState,
            { payload }: PayloadAction<AddressRequestPayload & { requestedAt: number }>,
        ) => {
            const wallet = getWallet(state, payload.staticSessionId);
            const requests = wallet.addressRequests ?? [];
            const request = requests.find(
                ({ npub, slip44 }) => npub === payload.npub && slip44 === payload.slip44,
            );

            if (!request) {
                const { npub, slip44, requestedAt } = payload;
                wallet.addressRequests = [...requests, { npub, slip44, requestedAt }];
            } else if (payload.requestedAt > request.requestedAt) {
                request.requestedAt = payload.requestedAt;
            }
        },
        handleAddressRequest: (
            state: ContactsState,
            { payload }: PayloadAction<AddressRequestPayload>,
        ) => {
            const request = getWallet(state, payload.staticSessionId).addressRequests?.find(
                ({ npub, slip44 }) => npub === payload.npub && slip44 === payload.slip44,
            );

            if (request) request.handledAt = request.requestedAt;
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

export const selectContactsMessaging = (
    state: ContactsRootState,
    staticSessionId: StaticSessionId,
) => state.contacts.wallets[staticSessionId]?.messaging;

const EMPTY_ADDRESS_REQUESTS: ContactAddressRequest[] = [];

export const selectContactAddressRequests = (
    state: ContactsRootState,
    staticSessionId: StaticSessionId,
): ContactAddressRequest[] =>
    state.contacts.wallets[staticSessionId]?.addressRequests ?? EMPTY_ADDRESS_REQUESTS;

/** Whether the request came after the wallet last answered or dismissed that contact's request. */
export const isContactAddressRequestPending = ({ requestedAt, handledAt }: ContactAddressRequest) =>
    handledAt === undefined || requestedAt > handledAt;
