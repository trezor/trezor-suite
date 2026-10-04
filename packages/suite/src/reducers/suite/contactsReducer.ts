import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';
import { type SuiteSettingsRootState, selectHasExperimentalFeature } from '@suite/settings';
import { deviceActions } from '@suite-common/device';
import { type StaticSessionId } from '@trezor/connect';

import { STORAGE } from 'src/actions/suite/constants';
import { type StorageLoadAction } from 'src/actions/suite/storageActions';
import { type Attestation } from 'src/utils/contacts/attestation';
import { isContactsSlip44 } from 'src/utils/contacts/coin';
import { isValidNpubHex } from 'src/utils/contacts/npub';
import { isSharedAddressOutstanding } from 'src/utils/contacts/sharing';

// Contacts belong to a wallet, not to a device: the identity and the WARD entries are derived from
// seed + passphrase. Everything is therefore keyed by the full static session id, never by its
// `split('@')[0]` prefix, which drops the passphrase part and would merge distinct wallets.
// The static session id is confidential: it may key state and IndexedDB, but it must never reach
// logs, analytics, Sentry or a relay.

export type Contact = {
    /** The contact's identity: 64-char lowercase hex x-only secp256k1 public key. */
    npub: string;
    /** The name the user gave this identity. */
    label: string;
    addedAt: number;
    /**
     * Whether the user confirmed this contact's key on the device. Display hint only: payability
     * is decided by `DeviceAuthorityState.anchoredNpubs`, never by this flag.
     */
    isVerified: boolean;
};

export type PendingRequest = {
    /** The contact who asked me for a receive address. */
    npub: string;
    /** SLIP-44 coin type the contact asked for; requests are per coin. */
    slip44: number;
    receivedAt: number;
    /**
     * Every relay event id that produced or refreshed this entry. A contact's retries for one coin
     * collapse into one inbox row, so a dismiss must tombstone all of them, otherwise the relay's
     * backlog replay of a retry would bring the dismissed row back on the next reconnect.
     */
    eventIds: string[];
};

export type SharedAddress = {
    /** The contact I shared this address with. */
    npub: string;
    /** Kept so it can be re-sent to the contact without another device confirmation. */
    attestation: Attestation;
    sharedAt: number;
};

export type ContactsWalletState = {
    /** This wallet's own identity, hex. */
    identityNpub?: string;
    contacts: Record<string, Contact>;
    /**
     * Addresses proven to belong to a contact, keyed by address. A contact's addresses that are not
     * in `spentContactAddresses` form the buffer I can pay that contact from.
     */
    verifiedAddresses: Record<string, Attestation>;
    /** A contact's addresses I already paid to, so a payment never reuses one. */
    spentContactAddresses: Record<string, boolean>;
    /** My receive addresses that I attested and shared with a contact, keyed by my address. */
    sharedAddresses: Record<string, SharedAddress>;
    /** My shared addresses that have since been used on-chain. */
    spentSharedAddresses: Record<string, boolean>;
    /** Relay event ids of address requests already served automatically (most recent last). */
    servedRequestIds: string[];
    /** Relay event ids of address requests the user dismissed (most recent last). */
    dismissedRequestIds: string[];
    /** Address requests I could not serve automatically, keyed by `pendingRequestKey`. */
    pendingRequests: Record<string, PendingRequest>;
    /** Whether the user has passed the first-run contacts screen for this wallet. */
    isOnboarded: boolean;
};

export type ContactAnchor = {
    /** The name saved in WARD with the key the user confirmed on the device. */
    label: string;
    anchoredAt: number;
};

/**
 * Local device authority: the only source of payability. It is written only after a successful
 * device operation (the user confirmed the contact's key on the device), so nothing derived from
 * relay or other untrusted input can make a contact payable. Absent means nothing is payable.
 */
export type DeviceAuthorityState = {
    /** Identities whose key the user confirmed on this device. */
    anchoredNpubs: Record<string, ContactAnchor>;
};

/** Status of the relay connections. App-global, in-memory only, never persisted. */
export type RelayStatus = {
    isConnected: boolean;
    /** Unix ms of the last processed relay event. */
    lastEventAt?: number;
    /** Whether each configured relay URL currently has an open socket. */
    urlStatus?: Record<string, boolean>;
};

export type ContactsState = {
    byWallet: Partial<Record<StaticSessionId, ContactsWalletState>>;
    deviceAuthority: Partial<Record<StaticSessionId, DeviceAuthorityState>>;
    relay: RelayStatus;
};

export type ContactsRootState = {
    contacts: ContactsState;
};

export type ContactsFeatureRootState = SuiteSettingsRootState & DebugRootState;

// Every relay of a wallet replays its stored backlog when the wallet's pool is rebuilt. These caps
// must stay above the number of events all of them together can replay, otherwise an evicted id
// that is still replayed would be served again or would bring a dismissed request back.
export const MAX_SERVED_REQUEST_IDS = 2000;
export const MAX_DISMISSED_REQUEST_IDS = 2000;
// Bounds one inbox row, so a contact spamming retries for one coin cannot grow it without limit.
const MAX_PENDING_REQUEST_EVENT_IDS = 64;

/**
 * Pending requests are keyed by (npub, slip44), so a contact who asks for a mainnet and a testnet
 * address gets two entries that are served and cleared independently.
 */
export const pendingRequestKey = (npub: string, slip44: number) => `${npub}:${slip44}`;

/**
 * Returns a new per-wallet state. It must be a factory, not a shared constant: immer does not draft
 * newly assigned objects, so a nested write right after `byWallet[ds] ??= ...` in the same reducer
 * call would mutate (and freeze) a shared template and leak one wallet's data into another.
 */
export const createEmptyWalletState = (): ContactsWalletState => ({
    contacts: {},
    verifiedAddresses: {},
    spentContactAddresses: {},
    sharedAddresses: {},
    spentSharedAddresses: {},
    servedRequestIds: [],
    dismissedRequestIds: [],
    pendingRequests: {},
    isOnboarded: false,
});

export const createEmptyAuthority = (): DeviceAuthorityState => ({
    anchoredNpubs: {},
});

/**
 * Shared empty authority for read paths, so selectors keep a stable reference. Reducers never
 * write to it; they create their own instance.
 */
export const EMPTY_DEVICE_AUTHORITY: DeviceAuthorityState = createEmptyAuthority();

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Bounds the addresses of one contact and coin that I have not paid to. A contact whose key is
 * misused could otherwise send new ones without end, and each one rewrites the stored wallet and is
 * verified again in the send form. The cap counts per contact and coin type, not per account: an
 * honest peer who shares from several accounts of one coin can reach it, and its further addresses
 * are dropped until I pay to one of the stored ones.
 */
export const MAX_UNSPENT_CONTACT_ADDRESSES = 20;

/** How many of a contact's addresses for one coin I have not paid to yet. */
export const countUnspentContactAddresses = (
    wallet: Pick<ContactsWalletState, 'verifiedAddresses' | 'spentContactAddresses'>,
    npub: string,
    slip44: number,
): number =>
    Object.values(wallet.verifiedAddresses).filter(
        attestation =>
            attestation.npub === npub &&
            attestation.slip44 === slip44 &&
            !wallet.spentContactAddresses[attestation.address],
    ).length;

/**
 * Whether storing an attestation would change the wallet. A stored address is kept against:
 * - another identity, which could otherwise take over a contact's address in its payment buffer;
 * - another coin type, since an address belongs to one network, and moving it to another coin's
 *   count would let a contact past the cap;
 * - an attestation that is not newer, so a replayed one rewrites nothing.
 * A new address is refused once the contact holds the cap of unpaid addresses for its coin.
 */
export const canStoreAttestation = (
    wallet: Pick<ContactsWalletState, 'verifiedAddresses' | 'spentContactAddresses'>,
    attestation: Attestation,
): boolean => {
    const existing = wallet.verifiedAddresses[attestation.address];

    if (existing) {
        return (
            existing.npub === attestation.npub &&
            existing.slip44 === attestation.slip44 &&
            attestation.createdAt > existing.createdAt
        );
    }

    return (
        countUnspentContactAddresses(wallet, attestation.npub, attestation.slip44) <
        MAX_UNSPENT_CONTACT_ADDRESSES
    );
};

// A stored blob can hold more unpaid addresses of one contact and coin than the cap allows. The
// newest are kept. A record that is not an object is dropped, since every reader of the buffer
// reads its fields.
const capUnspentContactAddresses = (
    verifiedAddresses: Record<string, Attestation>,
    spentContactAddresses: Record<string, boolean>,
): Record<string, Attestation> => {
    const unspentByContactAndCoin = new Map<string, { address: string; createdAt: number }[]>();
    const dropped = new Set<string>();

    Object.entries<unknown>(verifiedAddresses).forEach(([address, attestation]) => {
        if (!isObjectRecord(attestation)) {
            dropped.add(address);

            return;
        }
        if (spentContactAddresses[address]) return;

        const key = JSON.stringify([attestation.npub, attestation.slip44]);
        const createdAt = typeof attestation.createdAt === 'number' ? attestation.createdAt : 0;
        const entries = unspentByContactAndCoin.get(key) ?? [];

        entries.push({ address, createdAt });
        unspentByContactAndCoin.set(key, entries);
    });

    unspentByContactAndCoin.forEach(entries => {
        entries
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(MAX_UNSPENT_CONTACT_ADDRESSES)
            .forEach(({ address }) => dropped.add(address));
    });

    return Object.fromEntries(
        Object.entries(verifiedAddresses).filter(([address]) => !dropped.has(address)),
    );
};

const sanitizeContact = (npub: string, contact: unknown): Contact | undefined => {
    // The key must also match the record, so a corrupt key can never shadow a good contact.
    if (!isValidNpubHex(npub) || !isObjectRecord(contact) || contact.npub !== npub) {
        return undefined;
    }
    // Search and the avatar read the label as a string.
    if (typeof contact.label !== 'string') return undefined;

    return {
        npub,
        label: contact.label,
        addedAt: typeof contact.addedAt === 'number' ? contact.addedAt : 0,
        isVerified: contact.isVerified === true,
    };
};

const sanitizePendingRequest = (key: string, request: unknown): PendingRequest | undefined => {
    if (!isObjectRecord(request)) return undefined;

    const { npub, slip44, receivedAt, eventIds } = request;
    if (typeof npub !== 'string' || !isValidNpubHex(npub)) return undefined;
    if (typeof slip44 !== 'number' || !isContactsSlip44(slip44)) return undefined;
    // Clearing and dismissing find a request by this key, so a row under any other key would stick.
    if (key !== pendingRequestKey(npub, slip44) || !Array.isArray(eventIds)) return undefined;

    return {
        npub,
        slip44,
        receivedAt: typeof receivedAt === 'number' ? receivedAt : 0,
        eventIds: eventIds.filter((eventId): eventId is string => typeof eventId === 'string'),
    };
};

/**
 * Load boundary for a persisted per-wallet blob. Contacts views pass npubs to `npubEncode`, which
 * throws on non-hex input, so one corrupt entry would crash the whole page. Every contact and
 * pending request is type-checked and rebuilt; one with an unusable identity is dropped (it can be
 * neither verified nor paid), and missing fields fall back to their empty defaults.
 */
export const sanitizeContactsWalletState = (
    wallet: Partial<ContactsWalletState>,
): ContactsWalletState => {
    const contacts: Record<string, Contact> = {};
    Object.entries<unknown>(wallet.contacts ?? {}).forEach(([npub, record]) => {
        const contact = sanitizeContact(npub, record);
        if (contact) contacts[npub] = contact;
    });

    const pendingRequests: Record<string, PendingRequest> = {};
    Object.entries<unknown>(wallet.pendingRequests ?? {}).forEach(([key, record]) => {
        const request = sanitizePendingRequest(key, record);
        if (request) pendingRequests[key] = request;
    });

    const identityNpub =
        typeof wallet.identityNpub === 'string' && isValidNpubHex(wallet.identityNpub)
            ? wallet.identityNpub
            : undefined;
    const spentContactAddresses = wallet.spentContactAddresses ?? {};

    return {
        identityNpub,
        contacts,
        verifiedAddresses: capUnspentContactAddresses(
            wallet.verifiedAddresses ?? {},
            spentContactAddresses,
        ),
        spentContactAddresses,
        sharedAddresses: wallet.sharedAddresses ?? {},
        spentSharedAddresses: wallet.spentSharedAddresses ?? {},
        servedRequestIds: wallet.servedRequestIds ?? [],
        dismissedRequestIds: wallet.dismissedRequestIds ?? [],
        pendingRequests,
        isOnboarded: wallet.isOnboarded === true,
    };
};

/**
 * Load boundary for a persisted device-authority blob. An anchor that is not a well-formed record is
 * dropped rather than kept: any value under an npub would make that contact payable.
 */
export const normalizeDeviceAuthority = (
    value: Partial<DeviceAuthorityState>,
): DeviceAuthorityState => {
    const anchoredNpubs: Record<string, ContactAnchor> = {};
    Object.entries<unknown>(value.anchoredNpubs ?? {}).forEach(([npub, anchor]) => {
        if (isValidNpubHex(npub) && isObjectRecord(anchor) && typeof anchor.label === 'string') {
            anchoredNpubs[npub] = {
                label: anchor.label,
                anchoredAt: typeof anchor.anchoredAt === 'number' ? anchor.anchoredAt : 0,
            };
        }
    });

    return { anchoredNpubs };
};

export const isLocallyAnchored = (auth: DeviceAuthorityState, npub: string): boolean =>
    auth.anchoredNpubs[npub] !== undefined;

/**
 * The npub that payments and address attestations use for a contact, or undefined when the contact
 * is not payable. Only the local device authority decides; `Contact.isVerified` is never consulted.
 */
export const contactPaymentNpub = (
    contact: Contact,
    auth: DeviceAuthorityState,
): string | undefined => (isLocallyAnchored(auth, contact.npub) ? contact.npub : undefined);

/** The name saved in WARD with the device-confirmed key wins over the locally stored one. */
export const contactDisplayLabel = (contact: Contact, auth: DeviceAuthorityState): string =>
    auth.anchoredNpubs[contact.npub]?.label ?? contact.label;

/** The contact behind a payment npub, or undefined when that npub has no local authority. */
export const findContactByPaymentNpub = (
    wallet: ContactsWalletState,
    auth: DeviceAuthorityState,
    paymentNpub: string,
): Contact | undefined =>
    isLocallyAnchored(auth, paymentNpub) ? wallet.contacts[paymentNpub] : undefined;

/** Only contacts may receive one of my addresses in reply to an address request. */
export const canServeAddressRequest = (wallet: ContactsWalletState, requester: string): boolean =>
    wallet.contacts[requester] !== undefined;

/** The peer npub to attest a shared address to, or undefined when the contact is not payable. */
export const resolveSharePeerNpub = (
    wallet: ContactsWalletState,
    auth: DeviceAuthorityState,
    npub: string,
): string | undefined => {
    const contact = wallet.contacts[npub];

    return contact ? contactPaymentNpub(contact, auth) : undefined;
};

type WalletScoped<T> = { deviceState: StaticSessionId } & T;

const initialState: ContactsState = {
    byWallet: {},
    deviceAuthority: {},
    relay: { isConnected: false },
};

const getWalletDraft = (state: ContactsState, deviceState: StaticSessionId) =>
    (state.byWallet[deviceState] ??= createEmptyWalletState());

const getAuthorityDraft = (state: ContactsState, deviceState: StaticSessionId) =>
    (state.deviceAuthority[deviceState] ??= createEmptyAuthority());

const contactsSlice = createSlice({
    name: '@suite/contacts',
    initialState,
    reducers: {
        identityLoaded(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ identityNpub: string }>>,
        ) {
            getWalletDraft(state, payload.deviceState).identityNpub = payload.identityNpub;
        },
        contactUpserted(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ contact: Contact }>>,
        ) {
            const wallet = getWalletDraft(state, payload.deviceState);
            const existing = wallet.contacts[payload.contact.npub];
            // A verify or rename upserts the whole record again; the contact keeps its place in the
            // recency order.
            wallet.contacts[payload.contact.npub] = {
                ...payload.contact,
                addedAt: existing?.addedAt ?? payload.contact.addedAt,
            };
        },
        contactRemoved(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ npub: string }>>,
        ) {
            // The anchor goes in the same step: a later local re-add of the same identity must not
            // inherit payability or the anchored name without a new device confirmation.
            delete state.deviceAuthority[payload.deviceState]?.anchoredNpubs[payload.npub];

            const wallet = state.byWallet[payload.deviceState];
            if (!wallet) return;

            delete wallet.contacts[payload.npub];

            // Nothing tied to a removed contact may linger: their attested addresses, my payments to
            // them, the addresses I shared with them and their pending requests.
            Object.entries(wallet.verifiedAddresses).forEach(([address, attestation]) => {
                if (attestation.npub === payload.npub) {
                    delete wallet.verifiedAddresses[address];
                    delete wallet.spentContactAddresses[address];
                }
            });
            Object.entries(wallet.sharedAddresses).forEach(([address, shared]) => {
                if (shared.npub === payload.npub) {
                    delete wallet.sharedAddresses[address];
                    delete wallet.spentSharedAddresses[address];
                }
            });
            Object.entries(wallet.pendingRequests).forEach(([key, request]) => {
                if (request.npub === payload.npub) {
                    delete wallet.pendingRequests[key];
                }
            });
        },
        requestServed(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ id: string }>>,
        ) {
            const wallet = getWalletDraft(state, payload.deviceState);
            if (wallet.servedRequestIds.includes(payload.id)) return;

            wallet.servedRequestIds.push(payload.id);
            if (wallet.servedRequestIds.length > MAX_SERVED_REQUEST_IDS) {
                wallet.servedRequestIds = wallet.servedRequestIds.slice(-MAX_SERVED_REQUEST_IDS);
            }
        },
        addressRequestReceived(
            state: ContactsState,
            {
                payload,
            }: PayloadAction<
                WalletScoped<{ npub: string; slip44: number; eventId: string; receivedAt: number }>
            >,
        ) {
            // Relay input: another coin type could never be served, and each distinct value would
            // open a new inbox row.
            if (!isContactsSlip44(payload.slip44)) return;

            const wallet = getWalletDraft(state, payload.deviceState);
            const key = pendingRequestKey(payload.npub, payload.slip44);
            const existing = wallet.pendingRequests[key];

            if (!existing) {
                wallet.pendingRequests[key] = {
                    npub: payload.npub,
                    slip44: payload.slip44,
                    receivedAt: payload.receivedAt,
                    eventIds: [payload.eventId],
                };

                return;
            }

            // A retry keeps the first-seen time, but its id is remembered for a later dismiss.
            if (!existing.eventIds.includes(payload.eventId)) {
                existing.eventIds.push(payload.eventId);
                if (existing.eventIds.length > MAX_PENDING_REQUEST_EVENT_IDS) {
                    existing.eventIds = existing.eventIds.slice(-MAX_PENDING_REQUEST_EVENT_IDS);
                }
            }
        },
        addressRequestCleared(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ npub: string; slip44: number }>>,
        ) {
            const wallet = state.byWallet[payload.deviceState];
            if (!wallet) return;

            delete wallet.pendingRequests[pendingRequestKey(payload.npub, payload.slip44)];
        },
        addressRequestDismissed(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ npub: string; slip44: number }>>,
        ) {
            const wallet = state.byWallet[payload.deviceState];
            const key = pendingRequestKey(payload.npub, payload.slip44);
            const existing = wallet?.pendingRequests[key];
            if (!wallet || !existing) return;

            existing.eventIds.forEach(id => {
                if (!wallet.dismissedRequestIds.includes(id)) {
                    wallet.dismissedRequestIds.push(id);
                }
            });
            if (wallet.dismissedRequestIds.length > MAX_DISMISSED_REQUEST_IDS) {
                wallet.dismissedRequestIds =
                    wallet.dismissedRequestIds.slice(-MAX_DISMISSED_REQUEST_IDS);
            }
            delete wallet.pendingRequests[key];
        },
        relayStatusUpdated(
            state: ContactsState,
            {
                payload,
            }: PayloadAction<{
                isConnected?: boolean;
                lastEventAt?: number;
                urlStatus?: Record<string, boolean>;
            }>,
        ) {
            if (payload.isConnected !== undefined) state.relay.isConnected = payload.isConnected;
            if (payload.lastEventAt !== undefined) state.relay.lastEventAt = payload.lastEventAt;
            if (payload.urlStatus !== undefined) state.relay.urlStatus = payload.urlStatus;
        },
        addressVerified(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ attestation: Attestation }>>,
        ) {
            const wallet = getWalletDraft(state, payload.deviceState);

            if (!canStoreAttestation(wallet, payload.attestation)) return;

            wallet.verifiedAddresses[payload.attestation.address] = payload.attestation;
        },
        contactAddressSpent(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ address: string }>>,
        ) {
            getWalletDraft(state, payload.deviceState).spentContactAddresses[payload.address] =
                true;
        },
        sharedAddressRecorded(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ address: string; shared: SharedAddress }>>,
        ) {
            const wallet = getWalletDraft(state, payload.deviceState);
            const existing = wallet.sharedAddresses[payload.address];
            // One address shared with two contacts would link their payments to me. Once the earlier
            // share is reclaimed, the address is handed out again, and the record must follow what
            // was published, otherwise the address would stay reclaimable and be handed out forever.
            if (
                existing &&
                existing.npub !== payload.shared.npub &&
                isSharedAddressOutstanding({
                    shared: existing,
                    isSpent: wallet.spentSharedAddresses[payload.address] === true,
                    now: payload.shared.sharedAt,
                })
            ) {
                return;
            }

            wallet.sharedAddresses[payload.address] = payload.shared;
        },
        sharedAddressUsed(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ address: string }>>,
        ) {
            getWalletDraft(state, payload.deviceState).spentSharedAddresses[payload.address] = true;
        },
        /** Dispatch only after the device operation that confirmed the key has succeeded. */
        contactAnchored(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ npub: string; label: string }>>,
        ) {
            getAuthorityDraft(state, payload.deviceState).anchoredNpubs[payload.npub] = {
                label: payload.label,
                anchoredAt: Date.now(),
            };
        },
        contactUnanchored(
            state: ContactsState,
            { payload }: PayloadAction<WalletScoped<{ npub: string }>>,
        ) {
            const auth = state.deviceAuthority[payload.deviceState];
            if (!auth) return;

            delete auth.anchoredNpubs[payload.npub];
        },
        contactsOnboarded(
            state: ContactsState,
            { payload }: PayloadAction<{ deviceState: StaticSessionId }>,
        ) {
            getWalletDraft(state, payload.deviceState).isOnboarded = true;
        },
    },
    extraReducers: builder => {
        builder
            // This runs while the store is created, so a throw on a corrupt row would stop Suite
            // from starting. A row that is not an object is skipped.
            .addCase(STORAGE.LOAD, (state: ContactsState, { payload }: StorageLoadAction) => {
                payload.contacts.forEach(({ key, value }) => {
                    if (!isObjectRecord(value)) return;

                    state.byWallet[key] = sanitizeContactsWalletState(value);
                });
                payload.contactsDeviceAuthority.forEach(({ key, value }) => {
                    if (!isObjectRecord(value)) return;

                    const authority = normalizeDeviceAuthority(value);
                    const roster = state.byWallet[key]?.contacts ?? {};
                    // The two stores are written separately, so an interrupted removal can leave a
                    // removed contact's anchor behind. It must not come back, or a re-add of the
                    // same identity would be payable without the device.
                    Object.keys(authority.anchoredNpubs).forEach(npub => {
                        if (roster[npub] === undefined) delete authority.anchoredNpubs[npub];
                    });
                    state.deviceAuthority[key] = authority;
                });
            })
            // Storage drops a forgotten wallet's rows, so memory must drop them too. Otherwise
            // authorizing the same wallet again would bring its contacts and anchors back, and
            // remembering it would write them to storage again.
            .addCase(deviceActions.forgetDevice, (state: ContactsState, { payload }) => {
                const deviceState = payload.device.state?.staticSessionId;
                if (!deviceState) return;

                delete state.byWallet[deviceState];
                delete state.deviceAuthority[deviceState];
            });
    },
});

export const contactsActions = contactsSlice.actions;
export const contactsReducer = contactsSlice.reducer;

export type ContactsAction = ReturnType<(typeof contactsActions)[keyof typeof contactsActions]>;

/** Fails closed: a wallet without a stored authority gets the shared empty one. */
export const selectDeviceAuthority = (
    state: ContactsRootState,
    deviceState: StaticSessionId,
): DeviceAuthorityState => state.contacts.deviceAuthority[deviceState] ?? EMPTY_DEVICE_AUTHORITY;

/**
 * The authority entry as stored, or undefined when the wallet never had one. Persistence reads this
 * instead of selectDeviceAuthority, whose empty fallback would give every remembered wallet an
 * authority row, even one that never confirmed a contact.
 */
export const selectStoredDeviceAuthority = (
    state: ContactsRootState,
    deviceState: StaticSessionId,
): DeviceAuthorityState | undefined => state.contacts.deviceAuthority[deviceState];

/**
 * Returns the stored object by reference, so callers can memoize on it: the reference changes only
 * when this wallet's contacts state changes.
 */
export const selectContactsWallet = (
    state: ContactsRootState,
    deviceState: StaticSessionId,
): ContactsWalletState | undefined => state.contacts.byWallet[deviceState];

const EMPTY_RELAY_URL_STATUSES: Record<string, boolean> = {};

export const selectRelayUrlStatuses = (state: ContactsRootState): Record<string, boolean> =>
    state.contacts.relay.urlStatus ?? EMPTY_RELAY_URL_STATUSES;

export const selectContactsRelayConnected = (state: ContactsRootState): boolean =>
    state.contacts.relay.isConnected;

export const selectHasPendingAddressRequests = (
    state: ContactsRootState,
    deviceState: StaticSessionId | undefined,
): boolean =>
    deviceState !== undefined &&
    Object.keys(state.contacts.byWallet[deviceState]?.pendingRequests ?? {}).length > 0;

/**
 * The single gate for everything contacts does: the nav item, the page, the relay and WARD work.
 * The experimental flag stays stored when debug mode is turned off (`isDisabled` only hides its
 * toggle), so leaving debug mode must switch the feature off here.
 */
export const selectIsContactsFeatureEnabled = (state: ContactsFeatureRootState): boolean =>
    selectHasExperimentalFeature('contacts')(state) && selectIsDebugModeActive(state);
