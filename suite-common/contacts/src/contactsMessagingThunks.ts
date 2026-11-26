import { type DeviceRootState } from '@suite-common/device';
import {
    type SuiteSyncDataRootState,
    selectSuiteSyncContactAddresses,
} from '@suite-common/suite-sync';
import TrezorConnect, { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { type WithServices, createThunk } from '@trezor/redux-utils';
import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import { type ContactAddressShare, serializeContactAddressShare } from './contactAddressShare';
import { addContactAddressThunk } from './contactAddressThunks';
import { CONTACTS_SLIP44S } from './contactPayments';
import { type ContactsError, getContactsErrorFromConnect } from './contactsErrors';
import {
    CONTACTS_HOT_KEY_CIPHER_KEY_VALUE,
    getContactsHotKey,
    getHotKeyAttestationDraft,
} from './contactsHotKey';
import { type ContactsMessage } from './contactsMessages';
import {
    type ContactsRootState,
    contactsActions,
    selectContactsIdentityNpub,
    selectContactsMessaging,
} from './contactsSlice';
import {
    CONTACTS_ACTION_PREFIX,
    CONTACTS_IDENTITY_PATH,
    type ContactsStorageDeps,
    findContact,
    getConnectDevice,
    getContactsDevice,
    getPayerDevice,
} from './contactsThunkHelpers';
import { type EnsureContactIdentityThunkState, ensureContactIdentityThunk } from './contactsThunks';
import { type ContactsMessagingDep } from './createContactsMessaging';
import { decodeNpub } from './npub';

type ContactsMessagingServiceDeps = WithServices<ContactsMessagingDep>;

const getNowSeconds = () => Math.floor(Date.now() / 1000);

type ReceiveContactsMessageThunkParams = {
    staticSessionId: StaticSessionId;
    message: ContactsMessage;
    createdAt: number;
};

type ReceiveContactsMessageThunkState = DeviceRootState & SuiteSyncDataRootState;

type ReceiveContactsMessageThunkDeps = ContactsStorageDeps;

/**
 * What arrived in the wallet's inbox: a request goes to the inbox list, an address a contact's
 * Trezor attested is kept for the send form (if the wallet has the contact).
 */
export const receiveContactsMessageThunk = createThunk<
    Result<void, ContactsError>,
    ReceiveContactsMessageThunkParams,
    { state: ReceiveContactsMessageThunkState; extra: ReceiveContactsMessageThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/receiveContactsMessageThunk`,
    async ({ staticSessionId, message, createdAt }, { dispatch, getState }) => {
        const contactsDevice = getContactsDevice(getState());

        // The inbox closes when another wallet is selected; a message on its way is dropped.
        if (!contactsDevice.success || contactsDevice.payload.staticSessionId !== staticSessionId) {
            return ok();
        }

        switch (message.type) {
            case 'AddressRequest': {
                const { npub, slip44 } = message;

                dispatch(
                    contactsActions.receiveAddressRequest({
                        staticSessionId,
                        npub,
                        slip44,
                        requestedAt: createdAt,
                    }),
                );

                return ok();
            }
            case 'Address': {
                const { npub, slip44, address } = message.share;
                // The relays replay the inbox on every start; a kept address is not written again.
                const isKnown = selectSuiteSyncContactAddresses(
                    getState(),
                    parseStaticSessionId(staticSessionId).walletDescriptor,
                ).some(
                    contactAddress =>
                        contactAddress.npub === npub &&
                        contactAddress.slip44 === slip44 &&
                        contactAddress.address === address,
                );

                if (isKnown) {
                    return ok();
                }

                const added = await dispatch(
                    addContactAddressThunk({
                        npub,
                        text: serializeContactAddressShare(message.share),
                    }),
                ).unwrap();

                return added.success ? ok() : added;
            }
            default:
                return exhaustive(message);
        }
    },
);

type StartContactsMessagingThunkParams = {
    relayUrls: string[];
};

type StartContactsMessagingThunkState = EnsureContactIdentityThunkState &
    ReceiveContactsMessageThunkState;

type StartContactsMessagingThunkDeps = ContactsMessagingServiceDeps &
    ReceiveContactsMessageThunkDeps;

/**
 * Opens the selected wallet's inbox on the relays. The Trezor derives the hot key silently; the
 * key never enters the store, only the messenger that holds it does, as a service.
 */
export const startContactsMessagingThunk = createThunk<
    Result<void, ContactsError>,
    StartContactsMessagingThunkParams,
    { state: StartContactsMessagingThunkState; extra: StartContactsMessagingThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/startContactsMessagingThunk`,
    async ({ relayUrls }, { dispatch, getState, extra, signal }) => {
        const contactsDevice = getContactsDevice(getState());

        if (!contactsDevice.success) {
            return contactsDevice;
        }

        if (relayUrls.length === 0) {
            return err({ type: 'MessagingUnavailable' });
        }

        const { staticSessionId } = contactsDevice.payload;
        const identity = await dispatch(
            ensureContactIdentityThunk({ contactsDevice: contactsDevice.payload }),
        ).unwrap();

        if (!identity.success) {
            return identity;
        }

        const identityPubkey = decodeNpub(identity.payload);
        const response = await TrezorConnect.cipherKeyValue({
            device: getConnectDevice(contactsDevice.payload),
            ...CONTACTS_HOT_KEY_CIPHER_KEY_VALUE,
        });

        if (!response.success) {
            return err(getContactsErrorFromConnect(response.error));
        }

        const hotKey = getContactsHotKey(response.payload.value);

        if (!identityPubkey.success || !hotKey.success) {
            return err({ type: 'DeviceFailed', message: 'The Trezor returned no messaging key' });
        }

        // The page closed or another wallet was selected while the Trezor answered.
        if (signal.aborted) {
            hotKey.payload.secretKey.fill(0);

            return err({ type: 'Cancelled' });
        }

        dispatch(
            contactsActions.setMessaging({
                staticSessionId,
                messaging: { relayCount: relayUrls.length, connectedRelayCount: 0 },
            }),
        );

        const messenger = extra.services.contactsMessaging.start({
            staticSessionId,
            relayUrls,
            identityPubkey: identityPubkey.payload,
            hotKey: hotKey.payload,
            onMessage: received => {
                dispatch(receiveContactsMessageThunk({ staticSessionId, ...received }));
            },
            onStatusChange: connectedRelayCount =>
                dispatch(
                    contactsActions.setMessagingRelayStatus({
                        staticSessionId,
                        connectedRelayCount,
                    }),
                ),
        });
        const isHotKeyAttested = await messenger.isHotKeyAttested();

        if (extra.services.contactsMessaging.get(staticSessionId) === messenger) {
            dispatch(contactsActions.setHotKeyAttested({ staticSessionId, isHotKeyAttested }));
        }

        return ok();
    },
);

type StopContactsMessagingThunkParams = {
    staticSessionId: StaticSessionId;
};

type StopContactsMessagingThunkDeps = ContactsMessagingServiceDeps;

/** Closes the wallet's inbox and forgets its hot key. */
export const stopContactsMessagingThunk = createThunk<
    void,
    StopContactsMessagingThunkParams,
    { extra: StopContactsMessagingThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/stopContactsMessagingThunk`,
    ({ staticSessionId }, { dispatch, extra }) => {
        extra.services.contactsMessaging.stop(staticSessionId);
        dispatch(contactsActions.setMessaging({ staticSessionId, messaging: undefined }));
    },
);

type PublishContactsHotKeyThunkState = DeviceRootState;

type PublishContactsHotKeyThunkDeps = ContactsMessagingServiceDeps;

/**
 * Has the wallet's identity attest its hot key, on the Trezor (one confirmation of a nostr
 * event), and publishes it, so contacts can reach the wallet.
 */
export const publishContactsHotKeyThunk = createThunk<
    Result<void, ContactsError>,
    void,
    { state: PublishContactsHotKeyThunkState; extra: PublishContactsHotKeyThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/publishContactsHotKeyThunk`,
    async (_, { dispatch, getState, extra }) => {
        const contactsDevice = getContactsDevice(getState());

        if (!contactsDevice.success) {
            return contactsDevice;
        }

        const { staticSessionId } = contactsDevice.payload;
        const messenger = extra.services.contactsMessaging.get(staticSessionId);

        if (!messenger) {
            return err({ type: 'MessagingUnavailable' });
        }

        const draft = getHotKeyAttestationDraft({
            hotPubkey: messenger.hotPubkey,
            createdAt: getNowSeconds(),
        });
        const response = await TrezorConnect.nostrSignEvent({
            device: getConnectDevice(contactsDevice.payload),
            path: CONTACTS_IDENTITY_PATH,
            created_at: draft.created_at,
            kind: draft.kind,
            tags: [],
            content: draft.content,
            __experimental: true,
        });

        if (!response.success) {
            return err(getContactsErrorFromConnect(response.error));
        }

        const { pubkey, id, signature } = response.payload;
        const published = await messenger.publishHotKeyAttestation({
            ...draft,
            pubkey,
            id,
            sig: signature,
        });

        if (!published.success) {
            return err(
                published.error === 'NotDelivered'
                    ? { type: 'MessageNotDelivered' }
                    : { type: 'DeviceFailed', message: 'The Trezor signed for another identity' },
            );
        }

        dispatch(contactsActions.setHotKeyAttested({ staticSessionId, isHotKeyAttested: true }));

        return ok();
    },
);

type RequestContactAddressThunkParams = {
    npub: string;
    slip44: number;
};

type RequestContactAddressThunkState = DeviceRootState & ContactsRootState & SuiteSyncDataRootState;

type RequestContactAddressThunkDeps = ContactsMessagingServiceDeps;

/** Asks a contact, over the relays, for an address their Trezor attests. */
export const requestContactAddressThunk = createThunk<
    Result<void, ContactsError>,
    RequestContactAddressThunkParams,
    { state: RequestContactAddressThunkState; extra: RequestContactAddressThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/requestContactAddressThunk`,
    async ({ npub, slip44 }, { getState, extra }) => {
        const payerDevice = getPayerDevice(getState());

        if (!payerDevice.success) {
            return payerDevice;
        }

        const { staticSessionId } = payerDevice.payload;
        const messenger = extra.services.contactsMessaging.get(staticSessionId);
        const ownNpub = selectContactsIdentityNpub(getState(), staticSessionId);

        if (!messenger || ownNpub === undefined) {
            return err({ type: 'MessagingUnavailable' });
        }

        const contactPubkey = decodeNpub(npub);

        if (!contactPubkey.success || !findContact(getState(), staticSessionId, npub)) {
            return err({ type: 'UnknownContact' });
        }

        if (!CONTACTS_SLIP44S.includes(slip44)) {
            return err({ type: 'UnsupportedAccount' });
        }

        // The contact replies to this hot key; without its attestation they would not find it.
        if (selectContactsMessaging(getState(), staticSessionId)?.isHotKeyAttested !== true) {
            return err({ type: 'HotKeyNotPublished' });
        }

        const recipientHotPubkey = await messenger.fetchHotKey(contactPubkey.payload);

        if (recipientHotPubkey === undefined) {
            return err({ type: 'ContactNotReachable' });
        }

        const sent = await messenger.send({
            recipientHotPubkey,
            message: { type: 'AddressRequest', npub: ownNpub, slip44 },
        });

        return sent.success ? ok() : err({ type: 'MessageNotDelivered' });
    },
);

type FetchContactHotKeyThunkParams = {
    npub: string;
};

type FetchContactHotKeyThunkState = DeviceRootState;

type FetchContactHotKeyThunkDeps = ContactsMessagingServiceDeps;

/** The hot key a requester's identity attested: an address goes there, never to a key a request names. */
export const fetchContactHotKeyThunk = createThunk<
    Result<string, ContactsError>,
    FetchContactHotKeyThunkParams,
    { state: FetchContactHotKeyThunkState; extra: FetchContactHotKeyThunkDeps }
>(`${CONTACTS_ACTION_PREFIX}/fetchContactHotKeyThunk`, async ({ npub }, { getState, extra }) => {
    const contactsDevice = getContactsDevice(getState());

    if (!contactsDevice.success) {
        return contactsDevice;
    }

    const messenger = extra.services.contactsMessaging.get(contactsDevice.payload.staticSessionId);

    if (!messenger) {
        return err({ type: 'MessagingUnavailable' });
    }

    const pubkey = decodeNpub(npub);
    const hotPubkey = pubkey.success ? await messenger.fetchHotKey(pubkey.payload) : undefined;

    return hotPubkey === undefined ? err({ type: 'ContactNotReachable' }) : ok(hotPubkey);
});

type SendContactAddressThunkParams = {
    /** Whose request the address answers. */
    npub: string;
    recipientHotPubkey: string;
    share: ContactAddressShare;
};

type SendContactAddressThunkState = DeviceRootState;

type SendContactAddressThunkDeps = ContactsMessagingServiceDeps;

/** Sends an attested address to the requester and settles their request. */
export const sendContactAddressThunk = createThunk<
    Result<void, ContactsError>,
    SendContactAddressThunkParams,
    { state: SendContactAddressThunkState; extra: SendContactAddressThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/sendContactAddressThunk`,
    async ({ npub, recipientHotPubkey, share }, { dispatch, getState, extra }) => {
        const contactsDevice = getContactsDevice(getState());

        if (!contactsDevice.success) {
            return contactsDevice;
        }

        const { staticSessionId } = contactsDevice.payload;
        const messenger = extra.services.contactsMessaging.get(staticSessionId);

        if (!messenger) {
            return err({ type: 'MessagingUnavailable' });
        }

        const sent = await messenger.send({
            recipientHotPubkey,
            message: { type: 'Address', share },
        });

        if (!sent.success) {
            return err({ type: 'MessageNotDelivered' });
        }

        dispatch(
            contactsActions.handleAddressRequest({ staticSessionId, npub, slip44: share.slip44 }),
        );

        return ok();
    },
);

type DismissContactAddressRequestThunkParams = {
    npub: string;
    slip44: number;
};

type DismissContactAddressRequestThunkState = DeviceRootState;

/** Hides a request until the contact asks again. */
export const dismissContactAddressRequestThunk = createThunk<
    void,
    DismissContactAddressRequestThunkParams,
    { state: DismissContactAddressRequestThunkState }
>(
    `${CONTACTS_ACTION_PREFIX}/dismissContactAddressRequestThunk`,
    ({ npub, slip44 }, { dispatch, getState }) => {
        const contactsDevice = getContactsDevice(getState());

        if (contactsDevice.success) {
            const { staticSessionId } = contactsDevice.payload;

            dispatch(contactsActions.handleAddressRequest({ staticSessionId, npub, slip44 }));
        }
    },
);
