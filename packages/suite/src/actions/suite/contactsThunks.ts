import { bytesToHex } from '@noble/hashes/utils.js';

import { type SuiteSettingsRootState, selectContactsRelayUrls } from '@suite/settings';
import {
    type DeviceRootState,
    isTrezorDeviceWithState,
    selectDeviceByStaticSessionId,
    selectSelectedDevice,
} from '@suite-common/device';
import { receiveActions } from '@suite-common/receive';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { type Result, err, ok } from '@trezor/type-utils';
import { typedObjectEntries } from '@trezor/utils';

import {
    type WardFlushThunkDeps,
    type WardFlushThunkState,
    type WardQueueEntryThunkState,
    wardFlushThunk,
    wardQueueEntryThunk,
} from 'src/actions/suite/wardThunks';
import {
    type ContactsFeatureRootState,
    type ContactsRootState,
    type ContactsWalletState,
    MAX_PENDING_REQUEST_EVENT_IDS,
    canServeAddressRequest,
    canStoreAttestation,
    contactDisplayLabel,
    contactPaymentNpub,
    contactsActions,
    findContactByPaymentNpub,
    isLocallyAnchored,
    pendingRequestKey,
    resolveSharePeerNpub,
    selectContactsWallet,
    selectContactsWallets,
    selectDeviceAuthority,
    selectIsContactsFeatureEnabled,
} from 'src/reducers/suite/contactsReducer';
import { getEffectiveRelayUrls } from 'src/services/nostr';
import { syncDesktopRelayAllowlist } from 'src/services/nostr/desktopRelayAllowlist';
import {
    KIND_ADDRESS_REPLY,
    KIND_ADDRESS_REQUEST,
    type NostrEvent,
} from 'src/services/nostr/relayClient';
import {
    disposeAllRelayPools,
    disposeRelayPoolsExcept,
    publishDraftToPool,
    queryRelaysOnce,
    reconcileRelayPool,
} from 'src/services/nostr/relayPool';
import {
    ATTESTATION_KIND,
    type Attestation,
    attestationContent,
    decodeAttestation,
    encodeAttestation,
    isAttestableAddress,
    verifyAttestation,
} from 'src/utils/contacts/attestation';
import { accountSlip44, isContactsSlip44 } from 'src/utils/contacts/coin';
import { type ContactsError, getContactsErrorFromConnect } from 'src/utils/contacts/contactsErrors';
import { isLabelWithinLimit } from 'src/utils/contacts/label';
import { isValidNpubHex } from 'src/utils/contacts/npub';
import {
    type SelectReceiveFlowExclusionsState,
    getShareableAddresses,
    selectReceiveFlowExclusions,
} from 'src/utils/contacts/sharing';
import { type WardError } from 'src/utils/suite/wardErrors';

const CONTACTS_PREFIX = '@suite/contacts';

// NIP-06 identity path. Pinned: the device must sign every attestation with the identity the peer
// stored, so a host must not be able to pick another path.
const IDENTITY_PATH = "m/44'/1237'/0'/0/0";

// The WARD app a contact's name is written under, with the 32-byte identity as the identifier and
// the UTF-8 label as the value. Nothing reads the entry at signing time on ward-draft firmware; the
// encoding is kept so that a later signing-time bind can show the contact's name.
const WARD_CONTACTS_APP_ID = 'contacts';

type SelectedWallet = {
    device: TrezorDeviceWithState;
    deviceState: StaticSessionId;
};

// Contacts belong to the selected wallet. Local changes need only its static session id; a device
// call additionally needs the device to be connected.
const getSelectedWallet = (state: DeviceRootState): SelectedWallet | undefined => {
    const device = selectSelectedDevice(state);

    return isTrezorDeviceWithState(device)
        ? { device, deviceState: device.state.staticSessionId }
        : undefined;
};

const getDeviceParam = (device: TrezorDeviceWithState) => ({
    path: device.path,
    state: device.state,
    instance: device.instance,
    useEmptyPassphrase: device.useEmptyPassphrase,
});

const isWalletStillSelected = (state: DeviceRootState, deviceState: StaticSessionId) =>
    getSelectedWallet(state)?.deviceState === deviceState;

export type LoadIdentityThunkState = DeviceRootState;

/**
 * Reads this wallet's contact identity from the device. No screen. Connect refuses the Nostr
 * methods on production firmware, which surfaces only here, as `firmware_unsupported`.
 */
export const loadIdentityThunk = createThunk<
    Result<string, ContactsError>,
    void,
    { state: LoadIdentityThunkState }
>(`${CONTACTS_PREFIX}/loadIdentity`, async (_, { dispatch, getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet?.device.connected) {
        return err({ code: 'no_device' });
    }

    const response = await TrezorConnect.nostrGetPublicKey({
        __experimental: true,
        path: IDENTITY_PATH,
        device: getDeviceParam(wallet.device),
    });

    if (!response.success) {
        return err(getContactsErrorFromConnect(response.error));
    }

    // Like the WARD writes, record nothing if the user switched wallets while the device answered.
    if (!isWalletStillSelected(getState(), wallet.deviceState)) {
        return err({ code: 'wallet_changed' });
    }

    const identityNpub = response.payload.pubkey;

    if (!isValidNpubHex(identityNpub)) {
        return err({ code: 'device_failure', detail: 'unexpected identity format' });
    }

    dispatch(contactsActions.identityLoaded({ deviceState: wallet.deviceState, identityNpub }));

    return ok(identityNpub);
});

type AddressRequest = {
    slip44: number;
    requester: string;
};

// Parses the `<slip44>:<requesterNpub>` content of an address request. The coin travels with the
// request, so mainnet and testnet requests are answered from their own buffers. Any other coin is
// dropped: it could never be served, and each value would open its own inbox row.
const parseAddressRequest = (content: string): AddressRequest | undefined => {
    const [slip44Text = '', ...requesterParts] = content.split(':');
    const slip44 = parseInt(slip44Text, 10);
    const requester = requesterParts.join(':').trim();

    return requesterParts.length > 0 && isContactsSlip44(slip44) && isValidNpubHex(requester)
        ? { slip44, requester }
        : undefined;
};

// Address requests are unauthenticated, so whoever saw one, or my reply to it, on a relay can send
// it again under fresh event ids. Each serve publishes to every relay and is an IndexedDB write, so
// one attestation goes to one requester at most once per window. A legitimate retry within the
// window would get nothing new anyway: the reply is already on the relays.
const SERVE_THROTTLE_MS = 5 * 60 * 1000;

// The attestation last served per wallet, requester and coin, and when.
const lastServedAttestations = new Map<string, { eventId: string; servedAt: number }>();

type HandleRelayEventThunkParams = {
    event: NostrEvent;
    /** The wallet whose pool received the event, which need not be the selected one. */
    deviceState: StaticSessionId;
};

export type HandleRelayEventThunkState = ContactsRootState;

/**
 * The relay is untrusted: a reply is admitted only with a valid attestation from a contact anchored
 * on this device, and nothing trusts `event.pubkey`. Every relay (re)connect replays the stored
 * backlog, and each contacts action is an IndexedDB write, so an event that changes nothing must
 * not dispatch anything.
 */
export const handleRelayEventThunk = createThunk<
    void,
    HandleRelayEventThunkParams,
    { state: HandleRelayEventThunkState }
>(`${CONTACTS_PREFIX}/handleRelayEvent`, ({ event, deviceState }, { dispatch, getState }) => {
    const wallet = selectContactsWallet(getState(), deviceState);

    if (!wallet) return;

    if (event.kind === KIND_ADDRESS_REPLY) {
        const attestation = decodeAttestation(event.content);

        if (!attestation) return;

        const auth = selectDeviceAuthority(getState(), deviceState);

        if (!findContactByPaymentNpub(wallet, auth, attestation.npub)) return;
        if (!verifyAttestation(attestation, attestation.npub)) return;

        // The reducer's rule: a replay, a re-signed copy that is not newer, a stored address under
        // another identity or coin type, and a new address over the cap change nothing.
        if (!canStoreAttestation(wallet, attestation)) return;

        dispatch(contactsActions.addressVerified({ deviceState, attestation }));
        dispatch(contactsActions.relayStatusUpdated({ lastEventAt: Date.now() }));

        return;
    }

    if (event.kind !== KIND_ADDRESS_REQUEST) return;

    const request = parseAddressRequest(event.content);

    if (!request) return;

    const { slip44, requester } = request;

    if (!canServeAddressRequest(wallet, requester)) return;

    // Anyone who knows my identity and a contact's can send this request, because it is neither
    // signed by nor encrypted to the requester. Serving it only re-sends an address that contact
    // already holds, so the leak is the relationship itself.
    if (wallet.servedRequestIds.includes(event.id)) return;
    if (wallet.dismissedRequestIds.includes(event.id)) return;

    const key = pendingRequestKey(requester, slip44);
    const shared = Object.values(wallet.sharedAddresses).find(
        sharedAddress =>
            sharedAddress.npub === requester &&
            sharedAddress.attestation.slip44 === slip44 &&
            !wallet.spentSharedAddresses[sharedAddress.attestation.address],
    );

    if (shared) {
        const throttleKey = `${deviceState}:${key}`;
        const lastServed = lastServedAttestations.get(throttleKey);
        const now = Date.now();

        if (
            lastServed?.eventId === shared.attestation.eventId &&
            now - lastServed.servedAt < SERVE_THROTTLE_MS
        ) {
            return;
        }

        lastServedAttestations.set(throttleKey, {
            eventId: shared.attestation.eventId,
            servedAt: now,
        });

        // Already attested, so serving it needs no device.
        publishDraftToPool(deviceState, {
            kind: KIND_ADDRESS_REPLY,
            tags: [['p', requester]],
            content: encodeAttestation(shared.attestation),
        });
        dispatch(contactsActions.requestServed({ deviceState, id: event.id }));

        if (wallet.pendingRequests[key]) {
            dispatch(
                contactsActions.addressRequestCleared({ deviceState, npub: requester, slip44 }),
            );
        }

        dispatch(contactsActions.relayStatusUpdated({ lastEventAt: Date.now() }));

        return;
    }

    // Nothing to serve for this coin, so the request goes to the inbox, where the user can attest a
    // fresh address. A retry under a new event id is recorded too, so that a dismissal later covers
    // it and its replay cannot bring the row back. A full row already shows the request, and more
    // ids would only rewrite the stored wallet for every forged retry.
    const pendingEventIds = wallet.pendingRequests[key]?.eventIds ?? [];

    if (pendingEventIds.includes(event.id)) return;
    if (pendingEventIds.length >= MAX_PENDING_REQUEST_EVENT_IDS) return;

    dispatch(
        contactsActions.addressRequestReceived({
            deviceState,
            npub: requester,
            slip44,
            eventId: event.id,
            receivedAt: Date.now(),
        }),
    );
    dispatch(contactsActions.relayStatusUpdated({ lastEventAt: Date.now() }));
});

const getRelayListKey = (urls: readonly string[]) => JSON.stringify(urls);

type FetchContactBacklogThunkParams = {
    deviceState: StaticSessionId;
};

export type FetchContactBacklogThunkState = ContactsRootState &
    ContactsFeatureRootState &
    HandleRelayEventThunkState;

/**
 * Re-reads the replies addressed to this wallet once a contact becomes anchored. The live pool
 * received them earlier, dropped them because the sender was not anchored yet, and will not
 * replay them until it reconnects. Throwaway connections start with an empty dedup. The filter is
 * the one the live subscription already sends, so it tells the relays nothing new about who my
 * contacts are.
 */
export const fetchContactBacklogThunk = createThunk<
    void,
    FetchContactBacklogThunkParams,
    { state: FetchContactBacklogThunkState }
>(`${CONTACTS_PREFIX}/fetchContactBacklog`, async ({ deviceState }, { dispatch, getState }) => {
    if (!selectIsContactsFeatureEnabled(getState())) return;

    const identityNpub = selectContactsWallet(getState(), deviceState)?.identityNpub;

    if (!identityNpub) return;

    const urls = getEffectiveRelayUrls(selectContactsRelayUrls(getState()));
    const events = await queryRelaysOnce(urls, [
        { '#p': [identityNpub], kinds: [KIND_ADDRESS_REPLY] },
    ]);

    // Turning the feature off or changing the relays stops the query. Relay input counts only while
    // the exchange runs with the relays it came from, so what the query collected is dropped.
    if (
        !selectIsContactsFeatureEnabled(getState()) ||
        getRelayListKey(getEffectiveRelayUrls(selectContactsRelayUrls(getState()))) !==
            getRelayListKey(urls)
    ) {
        return;
    }

    events.forEach(event => {
        dispatch(handleRelayEventThunk({ event, deviceState }));
    });
});

type ContactNameParams = {
    /** Identity, 64-char hex. */
    npub: string;
    label: string;
};

export type AnchorContactOutcome = {
    /**
     * Set when wardd did not publish the entry the user confirmed. The contact is anchored either
     * way; the change waits in the device queue for the next flush, which the next contact write
     * or "Flush now" in the WARD debug settings runs.
     */
    flushError?: WardError;
};

export type AddContactThunkState = DeviceRootState &
    ContactsRootState &
    WardQueueEntryThunkState &
    WardFlushThunkState &
    FetchContactBacklogThunkState;

export type AddContactThunkDeps = WardFlushThunkDeps;

/**
 * Adds or updates a contact whose key the user confirms on the device. That confirmation, the
 * WARD queue write, is what anchors the contact and makes it payable; publishing the queued change
 * through wardd follows and may fail without undoing the anchor.
 */
export const addContactThunk = createThunk<
    Result<AnchorContactOutcome, ContactsError>,
    ContactNameParams,
    { state: AddContactThunkState; extra: AddContactThunkDeps }
>(`${CONTACTS_PREFIX}/addContact`, async ({ npub, label }, { dispatch, getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet) {
        return err({ code: 'no_device' });
    }

    const { deviceState } = wallet;
    const trimmedLabel = label.trim();

    if (!isValidNpubHex(npub)) {
        return err({ code: 'invalid_identity' });
    }

    if (!isLabelWithinLimit(trimmedLabel)) {
        return err({ code: 'invalid_label' });
    }

    if (npub === selectContactsWallet(getState(), deviceState)?.identityNpub) {
        return err({ code: 'own_identity' });
    }

    const wasAnchored = isLocallyAnchored(selectDeviceAuthority(getState(), deviceState), npub);

    // The request names this wallet, so a confirmed write belongs to it even if the user selected
    // another wallet during the confirmation. The anchor is recorded for it, and the flush below
    // then reports `wallet_changed`: the change waits in the device queue.
    const queued = await dispatch(
        wardQueueEntryThunk({
            deviceState,
            appId: WARD_CONTACTS_APP_ID,
            identifier: npub,
            value: bytesToHex(new TextEncoder().encode(trimmedLabel)),
        }),
    ).unwrap();

    if (!queued.success) {
        return err(queued.error);
    }

    // The contact goes first: loading from storage drops an anchor that has no contact.
    dispatch(
        contactsActions.contactUpserted({
            deviceState,
            contact: { npub, label: trimmedLabel, addedAt: Date.now(), isVerified: true },
        }),
    );
    dispatch(contactsActions.contactAnchored({ deviceState, npub, label: trimmedLabel }));

    if (!wasAnchored) {
        void dispatch(fetchContactBacklogThunk({ deviceState }));
    }

    const flushed = await dispatch(wardFlushThunk({ deviceState })).unwrap();

    return ok(flushed.success ? {} : { flushError: flushed.error });
});

type VerifyContactThunkParams = {
    npub: string;
};

export type VerifyContactThunkState = AddContactThunkState;

export type VerifyContactThunkDeps = AddContactThunkDeps;

/** Anchors a local contact under the name it already has. */
export const verifyContactThunk = createThunk<
    Result<AnchorContactOutcome, ContactsError>,
    VerifyContactThunkParams,
    { state: VerifyContactThunkState; extra: VerifyContactThunkDeps }
>(`${CONTACTS_PREFIX}/verifyContact`, ({ npub }, { dispatch, getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet) {
        return err({ code: 'no_device' });
    }

    const contact = selectContactsWallet(getState(), wallet.deviceState)?.contacts[npub];

    if (!contact) {
        return err({ code: 'unknown_contact' });
    }

    return dispatch(addContactThunk({ npub, label: contact.label })).unwrap();
});

export type RenameContactThunkState = AddContactThunkState;

export type RenameContactThunkDeps = AddContactThunkDeps;

/**
 * Renames a contact. An anchored contact's name lives in WARD too, so the entry is written and
 * confirmed on the device again; a local contact is renamed without the device.
 */
export const renameContactThunk = createThunk<
    Result<AnchorContactOutcome, ContactsError>,
    ContactNameParams,
    { state: RenameContactThunkState; extra: RenameContactThunkDeps }
>(`${CONTACTS_PREFIX}/renameContact`, ({ npub, label }, { dispatch, getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet) {
        return err({ code: 'no_device' });
    }

    const { deviceState } = wallet;
    const contact = selectContactsWallet(getState(), deviceState)?.contacts[npub];

    if (!contact) {
        return err({ code: 'unknown_contact' });
    }

    if (isLocallyAnchored(selectDeviceAuthority(getState(), deviceState), npub)) {
        return dispatch(addContactThunk({ npub, label })).unwrap();
    }

    const trimmedLabel = label.trim();

    if (!isLabelWithinLimit(trimmedLabel)) {
        return err({ code: 'invalid_label' });
    }

    dispatch(
        contactsActions.contactUpserted({
            deviceState,
            contact: { ...contact, label: trimmedLabel, isVerified: false },
        }),
    );

    return ok({});
});

type RemoveContactThunkParams = {
    npub: string;
};

export type RemoveContactThunkState = DeviceRootState;

/**
 * Removes a contact, its anchor and everything exchanged with it, without the device. The WARD
 * entry stays: nothing reads it at signing time, and Connect has no method that deletes it.
 */
export const removeContactThunk = createThunk<
    Result<void, ContactsError>,
    RemoveContactThunkParams,
    { state: RemoveContactThunkState }
>(`${CONTACTS_PREFIX}/removeContact`, ({ npub }, { dispatch, getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet) {
        return err({ code: 'no_device' });
    }

    if (!isValidNpubHex(npub)) {
        return err({ code: 'invalid_identity' });
    }

    dispatch(contactsActions.contactRemoved({ deviceState: wallet.deviceState, npub }));

    return ok();
});

export type AddLocalContactThunkState = DeviceRootState & ContactsRootState;

/**
 * Adds a contact without the device. It cannot be paid until the user verifies it, because only a
 * key confirmed on the device makes a contact payable.
 */
export const addLocalContactThunk = createThunk<
    Result<void, ContactsError>,
    ContactNameParams,
    { state: AddLocalContactThunkState }
>(`${CONTACTS_PREFIX}/addLocalContact`, ({ npub, label }, { dispatch, getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet) {
        return err({ code: 'no_device' });
    }

    const { deviceState } = wallet;
    const trimmedLabel = label.trim();
    const contactsWallet = selectContactsWallet(getState(), deviceState);

    if (!isValidNpubHex(npub)) {
        return err({ code: 'invalid_identity' });
    }

    if (!isLabelWithinLimit(trimmedLabel)) {
        return err({ code: 'invalid_label' });
    }

    if (npub === contactsWallet?.identityNpub) {
        return err({ code: 'own_identity' });
    }

    // Upserting an existing identity would turn a verified contact back into a local one.
    if (contactsWallet?.contacts[npub]) {
        return err({ code: 'duplicate_contact' });
    }

    dispatch(
        contactsActions.contactUpserted({
            deviceState,
            contact: { npub, label: trimmedLabel, addedAt: Date.now(), isVerified: false },
        }),
    );

    return ok();
});

type AttestAddressThunkParams = {
    account: Account;
    /** One of the account's receive addresses, as discovery reported it. */
    address: string;
    path: string;
};

export type AttestAddressThunkState = DeviceRootState & ContactsRootState;

/**
 * Has the device sign `<slip44>:<address>` with the wallet's identity key, as a Nostr event of the
 * attestation kind, which the user confirms on the device. The signing screen does not show
 * whether the address is this wallet's, and the account's addresses come from the backend, so the
 * device first derives the address at `path` without a screen, and only that address is signed.
 */
export const attestAddressThunk = createThunk<
    Result<Attestation, ContactsError>,
    AttestAddressThunkParams,
    { state: AttestAddressThunkState }
>(`${CONTACTS_PREFIX}/attestAddress`, async ({ account, address, path }, { getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet?.device.connected) {
        return err({ code: 'no_device' });
    }

    const { deviceState } = wallet;

    if (account.deviceState !== deviceState) {
        return err({ code: 'wallet_changed' });
    }

    const identityNpub = selectContactsWallet(getState(), deviceState)?.identityNpub;

    if (!identityNpub) {
        return err({ code: 'missing_identity' });
    }

    const slip44 = accountSlip44(account);

    if (
        account.networkType !== 'bitcoin' ||
        !isContactsSlip44(slip44) ||
        !isAttestableAddress(address)
    ) {
        return err({ code: 'unsupported_account' });
    }

    // A path outside the account would let the backend pick which of my keys gets attested. Under
    // the account's path the coin type is the account's too.
    if (!path.startsWith(`${account.path}/`)) {
        return err({ code: 'address_mismatch' });
    }

    const derived = await TrezorConnect.getAddress({
        device: getDeviceParam(wallet.device),
        path,
        coin: asCoinSymbol(account.symbol),
        unlockPath: account.unlockPath,
        showOnTrezor: false,
    });

    if (!derived.success) {
        return err(getContactsErrorFromConnect(derived.error));
    }

    if (derived.payload.address !== address) {
        return err({ code: 'address_mismatch' });
    }

    if (!isWalletStillSelected(getState(), deviceState)) {
        return err({ code: 'wallet_changed' });
    }

    const createdAt = Math.floor(Date.now() / 1000);
    const response = await TrezorConnect.nostrSignEvent({
        __experimental: true,
        path: IDENTITY_PATH,
        device: getDeviceParam(wallet.device),
        created_at: createdAt,
        kind: ATTESTATION_KIND,
        tags: [],
        content: attestationContent(slip44, derived.payload.address),
    });

    if (!response.success) {
        return err(getContactsErrorFromConnect(response.error));
    }

    if (!isWalletStillSelected(getState(), deviceState)) {
        return err({ code: 'wallet_changed' });
    }

    const attestation: Attestation = {
        npub: response.payload.pubkey,
        address: derived.payload.address,
        slip44,
        createdAt,
        kind: ATTESTATION_KIND,
        signature: response.payload.signature,
        eventId: response.payload.id,
    };

    // Peers verify against the identity they stored for me. Checking the same here, including the
    // recomputed event id, catches a firmware serialization that drifted from attestationEventId
    // before an unverifiable attestation is published.
    if (attestation.npub !== identityNpub || !verifyAttestation(attestation, identityNpub)) {
        return err({ code: 'invalid_attestation' });
    }

    return ok(attestation);
});

type ShareFreshAddressWithContactThunkParams = {
    npub: string;
    accountKey: AccountKey;
    /** A specific receive address to share. It must still be a fresh one. */
    path?: string;
};

export type ShareFreshAddressWithContactThunkState = AttestAddressThunkState &
    AccountsRootState &
    SelectReceiveFlowExclusionsState;

// Checked before and after the device confirmation, each time with the account as the state holds
// it then, so an address that received a payment or was given out on the Receive page meanwhile is
// never shared.
const selectShareableAddresses = (
    state: ShareFreshAddressWithContactThunkState,
    account: Account,
    wallet: ContactsWalletState,
) =>
    getShareableAddresses({
        account,
        wallet,
        now: Date.now(),
        ...selectReceiveFlowExclusions(state, account),
    });

/**
 * Attests one of my fresh receive addresses (one device confirmation) and sends it to a contact,
 * so their buffer of addresses to pay me refills. The address is marked touched on the Receive
 * page, which then never offers it to anyone else.
 */
export const shareFreshAddressWithContactThunk = createThunk<
    Result<Attestation, ContactsError>,
    ShareFreshAddressWithContactThunkParams,
    { state: ShareFreshAddressWithContactThunkState }
>(
    `${CONTACTS_PREFIX}/shareFreshAddressWithContact`,
    async ({ npub, accountKey, path }, { dispatch, getState }) => {
        const wallet = getSelectedWallet(getState());

        if (!wallet) {
            return err({ code: 'no_device' });
        }

        const { deviceState } = wallet;
        const account = selectAccountByKey(getState(), accountKey);

        // The identity that signs is the selected wallet's, so the account must be one of its own.
        if (account?.deviceState !== deviceState) {
            return err({ code: 'wallet_changed' });
        }

        const contactsWallet = selectContactsWallet(getState(), deviceState);
        const peerNpub =
            contactsWallet &&
            resolveSharePeerNpub(
                contactsWallet,
                selectDeviceAuthority(getState(), deviceState),
                npub,
            );

        if (!contactsWallet || !peerNpub) {
            return err({ code: 'unknown_contact' });
        }

        if (account.networkType !== 'bitcoin') {
            return err({ code: 'unsupported_account' });
        }

        // The fresh-address window advances only with on-chain activity, so without skipping my
        // outstanding shares every share would hand out the same address and link my contacts.
        const candidates = selectShareableAddresses(getState(), account, contactsWallet);
        const fresh = path ? candidates.find(candidate => candidate.path === path) : candidates[0];

        if (!fresh) {
            return err({ code: 'no_fresh_address' });
        }

        const attested = await dispatch(
            attestAddressThunk({ account, address: fresh.address, path: fresh.path }),
        ).unwrap();

        if (!attested.success) {
            return attested;
        }

        const attestation = attested.payload;
        const currentContactsWallet = selectContactsWallet(getState(), deviceState);

        // The contact may have been removed or lost its anchor during the confirmation.
        if (
            !currentContactsWallet ||
            resolveSharePeerNpub(
                currentContactsWallet,
                selectDeviceAuthority(getState(), deviceState),
                npub,
            ) !== peerNpub
        ) {
            return err({ code: 'unknown_contact' });
        }

        const currentAccount = selectAccountByKey(getState(), accountKey);

        if (!currentAccount) {
            return err({ code: 'wallet_changed' });
        }

        // The address may have received a payment or been given out during the confirmation.
        const isStillShareable = selectShareableAddresses(
            getState(),
            currentAccount,
            currentContactsWallet,
        ).some(candidate => candidate.address === attestation.address);

        if (!isStillShareable) {
            return err({ code: 'no_fresh_address' });
        }

        dispatch(
            contactsActions.sharedAddressRecorded({
                deviceState,
                address: attestation.address,
                shared: { npub: peerNpub, attestation, sharedAt: Date.now() },
            }),
        );

        // The reducer keeps an address that another contact still holds. Publishing it anyway
        // would give one address to two contacts without a record of it.
        const recorded = selectContactsWallet(getState(), deviceState)?.sharedAddresses[
            attestation.address
        ];

        if (recorded?.attestation.eventId !== attestation.eventId) {
            return err({ code: 'no_fresh_address' });
        }

        dispatch(
            receiveActions.touchAddress({
                accountKey,
                path: fresh.path,
                address: attestation.address,
            }),
        );

        // Only this coin's request is fulfilled; one for the other coin stays in the inbox.
        dispatch(
            contactsActions.addressRequestCleared({
                deviceState,
                npub: peerNpub,
                slip44: attestation.slip44,
            }),
        );
        publishDraftToPool(deviceState, {
            kind: KIND_ADDRESS_REPLY,
            tags: [['p', peerNpub]],
            content: encodeAttestation(attestation),
        });

        return ok(attestation);
    },
);

type GetFreshContactAddressThunkParams = {
    npub: string;
    slip44: number;
    /**
     * Addresses already in the current, unsent form. Spent addresses are recorded only after a
     * broadcast, so without this two outputs to one contact would get the same address.
     */
    exclude?: string[];
};

export type GetFreshContactAddressThunkState = DeviceRootState & ContactsRootState;

/**
 * The oldest of a contact's attested addresses that I have not paid to yet, or undefined when the
 * buffer is empty and an address has to be requested. Only a contact anchored on this device is
 * payable, and the attestation is verified again before it is handed out.
 */
export const getFreshContactAddressThunk = createThunk<
    { address: string; label: string } | undefined,
    GetFreshContactAddressThunkParams,
    { state: GetFreshContactAddressThunkState }
>(`${CONTACTS_PREFIX}/getFreshContactAddress`, ({ npub, slip44, exclude = [] }, { getState }) => {
    const wallet = getSelectedWallet(getState());
    const contactsWallet = wallet && selectContactsWallet(getState(), wallet.deviceState);
    const contact = contactsWallet?.contacts[npub];

    if (!wallet || !contactsWallet || !contact) return undefined;

    const auth = selectDeviceAuthority(getState(), wallet.deviceState);
    const paymentNpub = contactPaymentNpub(contact, auth);

    if (paymentNpub === undefined) return undefined;

    const excluded = new Set(exclude);
    const fresh = Object.values(contactsWallet.verifiedAddresses)
        .filter(
            attestation =>
                attestation.npub === paymentNpub &&
                attestation.slip44 === slip44 &&
                !contactsWallet.spentContactAddresses[attestation.address] &&
                !excluded.has(attestation.address) &&
                verifyAttestation(attestation, paymentNpub),
        )
        .sort((a, b) => a.createdAt - b.createdAt)[0];

    return fresh
        ? { address: fresh.address, label: contactDisplayLabel(contact, auth) }
        : undefined;
});

type MarkContactAddressSpentThunkParams = {
    address: string;
};

export type MarkContactAddressSpentThunkState = DeviceRootState;

/** Records a payment to a contact's address so it is never offered again. */
export const markContactAddressSpentThunk = createThunk<
    void,
    MarkContactAddressSpentThunkParams,
    { state: MarkContactAddressSpentThunkState }
>(`${CONTACTS_PREFIX}/markContactAddressSpent`, ({ address }, { dispatch, getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet) return;

    dispatch(contactsActions.contactAddressSpent({ deviceState: wallet.deviceState, address }));
});

type AddressRequestThunkParams = {
    npub: string;
    slip44: number;
};

export type RequestAddressFromContactThunkState = DeviceRootState & ContactsRootState;

/**
 * Asks a payable contact for a fresh address of one coin. The coin travels in the content, so a
 * testnet request is never answered with a mainnet address.
 */
export const requestAddressFromContactThunk = createThunk<
    void,
    AddressRequestThunkParams,
    { state: RequestAddressFromContactThunkState }
>(`${CONTACTS_PREFIX}/requestAddressFromContact`, ({ npub, slip44 }, { getState }) => {
    const wallet = getSelectedWallet(getState());
    const contactsWallet = wallet && selectContactsWallet(getState(), wallet.deviceState);
    const contact = contactsWallet?.contacts[npub];

    if (!wallet || !contactsWallet?.identityNpub || !contact || !isContactsSlip44(slip44)) {
        return;
    }

    const peerNpub = contactPaymentNpub(
        contact,
        selectDeviceAuthority(getState(), wallet.deviceState),
    );

    if (!peerNpub) return;

    // My identity travels in the content because the envelope key is ephemeral.
    publishDraftToPool(wallet.deviceState, {
        kind: KIND_ADDRESS_REQUEST,
        tags: [['p', peerNpub]],
        content: `${slip44}:${contactsWallet.identityNpub}`,
    });
});

export type DismissAddressRequestThunkState = DeviceRootState;

/**
 * Drops an address request the user cannot or will not serve, for example one for a coin without
 * an account. Its event ids are remembered, so the relay's backlog replay cannot bring it back.
 */
export const dismissAddressRequestThunk = createThunk<
    void,
    AddressRequestThunkParams,
    { state: DismissAddressRequestThunkState }
>(`${CONTACTS_PREFIX}/dismissAddressRequest`, ({ npub, slip44 }, { dispatch, getState }) => {
    const wallet = getSelectedWallet(getState());

    if (!wallet) return;

    dispatch(
        contactsActions.addressRequestDismissed({ deviceState: wallet.deviceState, npub, slip44 }),
    );
});

type ReplenishContactShareThunkParams = {
    /** The wallet that shared the address, which need not be the selected one. */
    deviceState: StaticSessionId;
    npub: string;
    slip44: number;
};

export type ReplenishContactShareThunkState = ContactsRootState;

/**
 * Re-sends a contact the next address of a coin that I already attested for them, after one of
 * that coin was used. No device. With none left the contact requests one, and the user attests it.
 */
export const replenishContactShareThunk = createThunk<
    void,
    ReplenishContactShareThunkParams,
    { state: ReplenishContactShareThunkState }
>(`${CONTACTS_PREFIX}/replenishContactShare`, ({ deviceState, npub, slip44 }, { getState }) => {
    const wallet = selectContactsWallet(getState(), deviceState);

    if (!wallet) return;

    const fresh = Object.values(wallet.sharedAddresses).find(
        shared =>
            shared.npub === npub &&
            shared.attestation.slip44 === slip44 &&
            !wallet.spentSharedAddresses[shared.attestation.address],
    );

    if (!fresh) return;

    publishDraftToPool(deviceState, {
        kind: KIND_ADDRESS_REPLY,
        tags: [['p', npub]],
        content: encodeAttestation(fresh.attestation),
    });
});

type MarkSharedAddressesUsedThunkParams = {
    account: Account;
};

export type MarkSharedAddressesUsedThunkState = ContactsRootState;

/**
 * Marks my shared addresses that this account update shows as used on-chain and tops up each
 * affected contact's buffer for that coin. Scoped to the account's wallet: the update may belong to
 * a wallet in the background.
 */
export const markSharedAddressesUsedThunk = createThunk<
    void,
    MarkSharedAddressesUsedThunkParams,
    { state: MarkSharedAddressesUsedThunkState }
>(`${CONTACTS_PREFIX}/markSharedAddressesUsed`, ({ account }, { dispatch, getState }) => {
    const { deviceState, addresses } = account;
    const wallet = selectContactsWallet(getState(), deviceState);

    if (!wallet || !addresses) return;

    const usedAddresses = new Set([
        ...addresses.used.map(({ address }) => address),
        ...addresses.unused.filter(({ transfers }) => transfers > 0).map(({ address }) => address),
    ]);
    const newlyUsed = Object.values(wallet.sharedAddresses).filter(
        shared =>
            usedAddresses.has(shared.attestation.address) &&
            !wallet.spentSharedAddresses[shared.attestation.address],
    );
    // One top-up per contact and coin: a used mainnet address must not re-send a testnet one.
    const toReplenish = new Map<string, { npub: string; slip44: number }>();

    newlyUsed.forEach(({ npub, attestation }) => {
        dispatch(contactsActions.sharedAddressUsed({ deviceState, address: attestation.address }));
        toReplenish.set(`${npub}:${attestation.slip44}`, { npub, slip44: attestation.slip44 });
    });

    toReplenish.forEach(({ npub, slip44 }) => {
        dispatch(replenishContactShareThunk({ deviceState, npub, slip44 }));
    });
});

// Wallets with at least one open relay socket, so the single status reflects any of them.
const connectedRelayWallets = new Set<StaticSessionId>();

// The relay list last sent to the desktop request filter and the promise of that update.
let relayHostAdmission: { key: string; admission: Promise<void> } | undefined;

// Admits the relay hosts in the desktop request filter. When the list changes, every pool and
// one-shot query closes first, so that no client of a removed relay keeps reconnecting to a host
// the filter no longer admits. The caller rebuilds the pools once the new list is admitted.
const admitRelayHosts = (urls: readonly string[]): Promise<void> => {
    const key = getRelayListKey(urls);

    if (relayHostAdmission?.key === key) return relayHostAdmission.admission;

    disposeAllRelayPools();
    connectedRelayWallets.clear();

    const admission = syncDesktopRelayAllowlist(urls);
    relayHostAdmission = { key, admission };

    return admission;
};

// A relay sees which identities one client subscribes with at the same time and from one IP, and
// can link them as one person's wallets. A passphrase wallet is meant to stay unlinkable to the
// standard wallet, so besides the selected wallet only remembered standard wallets keep a pool in
// the background. Any other wallet subscribes only while it is selected, and its new pool then
// receives the relays' replay of what it missed.
const getIsBackgroundRelayWallet = (state: DeviceRootState, deviceState: StaticSessionId) => {
    const device = selectDeviceByStaticSessionId(state, deviceState);

    return device?.remember === true && device.useEmptyPassphrase;
};

export type EnsureContactSyncThunkState = DeviceRootState &
    ContactsRootState &
    ContactsFeatureRootState &
    SuiteSettingsRootState &
    HandleRelayEventThunkState;

/**
 * Brings the relay pools in line with the state: one pool for the selected wallet and for each
 * remembered standard wallet with a known identity, subscribed to the address requests and replies
 * tagged with it, so the exchange runs in the background too. A passphrase wallet has a pool only
 * while it is selected. Idempotent; an unchanged pool is left alone. Never calls the device:
 * identities come from state. With the contacts feature off, every pool closes and the desktop
 * filter admits no relay host.
 */
export const ensureContactSyncThunk = createThunk<
    void,
    void,
    { state: EnsureContactSyncThunkState }
>(`${CONTACTS_PREFIX}/ensureContactSync`, async (_, { dispatch, getState }) => {
    if (!selectIsContactsFeatureEnabled(getState())) {
        disposeAllRelayPools();
        connectedRelayWallets.clear();
        lastServedAttestations.clear();
        dispatch(contactsActions.relayStatusUpdated({ isConnected: false, urlStatus: {} }));
        await admitRelayHosts([]);

        return;
    }

    const urls = getEffectiveRelayUrls(selectContactsRelayUrls(getState()));
    const urlsKey = getRelayListKey(urls);

    await admitRelayHosts(urls);

    // A later run owns the pools if the feature or the relay list changed in the meantime.
    if (
        !selectIsContactsFeatureEnabled(getState()) ||
        getRelayListKey(getEffectiveRelayUrls(selectContactsRelayUrls(getState()))) !== urlsKey
    ) {
        return;
    }

    const identities = new Map<StaticSessionId, string>();
    const selectedDeviceState = getSelectedWallet(getState())?.deviceState;

    typedObjectEntries(selectContactsWallets(getState())).forEach(([deviceState, wallet]) => {
        if (
            wallet?.identityNpub &&
            (deviceState === selectedDeviceState ||
                getIsBackgroundRelayWallet(getState(), deviceState))
        ) {
            identities.set(deviceState, wallet.identityNpub);
        }
    });

    disposeRelayPoolsExcept(new Set(identities.keys()));
    connectedRelayWallets.forEach(deviceState => {
        if (!identities.has(deviceState)) connectedRelayWallets.delete(deviceState);
    });
    dispatch(
        contactsActions.relayStatusUpdated({
            isConnected: connectedRelayWallets.size > 0,
            urlStatus: connectedRelayWallets.size > 0 ? undefined : {},
        }),
    );

    identities.forEach((identityNpub, deviceState) => {
        reconcileRelayPool({
            deviceState,
            subscription:
                urls.length > 0
                    ? {
                          urls,
                          filters: [
                              {
                                  '#p': [identityNpub],
                                  kinds: [KIND_ADDRESS_REQUEST, KIND_ADDRESS_REPLY],
                              },
                          ],
                      }
                    : undefined,
            onEvent: event => {
                dispatch(handleRelayEventThunk({ event, deviceState }));
            },
            onConnectedChange: (isConnected, connectedUrls) => {
                if (isConnected) {
                    connectedRelayWallets.add(deviceState);
                } else {
                    connectedRelayWallets.delete(deviceState);
                }

                dispatch(
                    contactsActions.relayStatusUpdated({
                        isConnected: connectedRelayWallets.size > 0,
                        urlStatus: Object.fromEntries(
                            urls.map(url => [url, connectedUrls.includes(url)]),
                        ),
                    }),
                );
            },
        });
    });
});
