import { type DeviceRootState } from '@suite-common/device';
import { type SuiteSyncDataRootState } from '@suite-common/suite-sync';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import { getContactNameValueHex, validateContactName } from './contactName';
import {
    type ContactsError,
    getContactsErrorFromConnect,
    isWardIdMismatch,
} from './contactsErrors';
import {
    type ContactWardStatus,
    type ContactsRootState,
    contactsActions,
    selectContactsIdentityNpub,
    selectContactsWardId,
} from './contactsSlice';
import {
    CONTACTS_ACTION_PREFIX,
    type ContactsDevice,
    type ContactsStorageDeps,
    ensureContactsStorage,
    findContact,
    getConnectDevice,
    getContactsDevice,
    getPayerDevice,
    isSelectedContactsDevice,
} from './contactsThunkHelpers';
import { encodeNpub, parseNpub } from './npub';

/** NIP-06: the key the Trezor derives the contact identity (npub) from. */
const IDENTITY_PATH = "m/44'/1237'/0'/0/0";

// The Trezor keeps contacts in the host label domain, keyed by the npub, valued by the name.
const CONTACT_WARD_APP_ID = 'bitcoin';
// wardd requires a network symbol, but with a raw value it is no part of the entry.
const CONTACT_WARD_NETWORK_SYMBOL = 'btc';

export type ContactsThunkState = DeviceRootState & ContactsRootState & SuiteSyncDataRootState;
export type ContactsThunkDeps = ContactsStorageDeps;

type LoadContactIdentityThunkParams = {
    /** Also show the npub on the Trezor, so a contact can compare it with what they were given. */
    showOnTrezor?: boolean;
    /** The wallet to read; the selected one by default. */
    contactsDevice?: ContactsDevice;
};

type LoadContactIdentityThunkState = DeviceRootState;

export const loadContactIdentityThunk = createThunk<
    Result<string, ContactsError>,
    LoadContactIdentityThunkParams,
    { state: LoadContactIdentityThunkState }
>(`${CONTACTS_ACTION_PREFIX}/loadContactIdentityThunk`, async (params, { dispatch, getState }) => {
    const contactsDevice = params.contactsDevice
        ? ok(params.contactsDevice)
        : getContactsDevice(getState());

    if (!contactsDevice.success) {
        return contactsDevice;
    }

    const { staticSessionId } = contactsDevice.payload;
    const response = await TrezorConnect.nostrGetPublicKey({
        device: getConnectDevice(contactsDevice.payload),
        path: IDENTITY_PATH,
        showOnTrezor: params.showOnTrezor === true,
        __experimental: true,
    });

    if (!response.success) {
        return err(getContactsErrorFromConnect(response.error));
    }

    const npub = encodeNpub(response.payload.pubkey);

    if (!npub.success) {
        return err({ type: 'DeviceFailed', message: 'The Trezor returned no identity key' });
    }

    dispatch(contactsActions.setIdentityNpub({ staticSessionId, npub: npub.payload }));

    return ok(npub.payload);
});

type ContactsDeviceThunkParams = {
    /** The wallet the operation started for; it never switches to another selected wallet. */
    contactsDevice: ContactsDevice;
};

type EnsureContactIdentityThunkState = DeviceRootState & ContactsRootState;

/** The wallet's npub, read from its Trezor (silently) if this session has not yet. */
const ensureContactIdentityThunk = createThunk<
    Result<string, ContactsError>,
    ContactsDeviceThunkParams,
    { state: EnsureContactIdentityThunkState }
>(
    `${CONTACTS_ACTION_PREFIX}/ensureContactIdentityThunk`,
    async ({ contactsDevice }, { dispatch, getState }) => {
        const knownNpub = selectContactsIdentityNpub(getState(), contactsDevice.staticSessionId);

        if (knownNpub !== undefined) {
            return ok(knownNpub);
        }

        const loaded = await dispatch(loadContactIdentityThunk({ contactsDevice })).unwrap();

        return loaded;
    },
);

type EnsureContactsWardIdThunkState = DeviceRootState & ContactsRootState;

/** The ward_id of the wallet, which every WARD call of the wallet is pinned to. */
const ensureContactsWardIdThunk = createThunk<
    Result<string, ContactsError>,
    ContactsDeviceThunkParams,
    { state: EnsureContactsWardIdThunkState }
>(
    `${CONTACTS_ACTION_PREFIX}/ensureContactsWardIdThunk`,
    async ({ contactsDevice }, { dispatch, getState }) => {
        const { staticSessionId } = contactsDevice;
        const knownWardId = selectContactsWardId(getState(), staticSessionId);

        if (knownWardId !== undefined) {
            return ok(knownWardId);
        }

        // WARD methods run on the session the last validated call left open, so a validated call
        // for this wallet goes first. The ward_id learned next is then this wallet's, and a pinned
        // call refuses any other wallet the Trezor may have open later.
        const identity = await dispatch(loadContactIdentityThunk({ contactsDevice })).unwrap();

        if (!identity.success) {
            return identity;
        }

        // A validated call for another wallet may have taken over the session meanwhile, and
        // then wardInit would learn that wallet's ward_id.
        if (!isSelectedContactsDevice(getState(), contactsDevice)) {
            return err({ type: 'WalletChanged' });
        }

        const response = await TrezorConnect.wardInit({
            device: getConnectDevice(contactsDevice),
        });

        if (!response.success) {
            return err(getContactsErrorFromConnect(response.error));
        }

        if (!isSelectedContactsDevice(getState(), contactsDevice)) {
            return err({ type: 'WalletChanged' });
        }

        dispatch(contactsActions.setWardId({ staticSessionId, wardId: response.payload.wardId }));

        return ok(response.payload.wardId);
    },
);

type WriteContactToWardThunkParams = ContactsDeviceThunkParams & {
    npub: string;
    /** The name to write, or undefined to delete the entry. */
    name: string | undefined;
};

type WriteContactToWardThunkState = EnsureContactsWardIdThunkState;

const writeContactToWardThunk = createThunk<
    Result<ContactWardStatus, ContactsError>,
    WriteContactToWardThunkParams,
    { state: WriteContactToWardThunkState }
>(
    `${CONTACTS_ACTION_PREFIX}/writeContactToWardThunk`,
    async ({ contactsDevice, npub, name }, { dispatch, getState }) => {
        // The caller already opened this wallet's Suite Sync, so the Trezor must not be asked
        // about another wallet that got selected while it waited.
        if (!isSelectedContactsDevice(getState(), contactsDevice)) {
            return err({ type: 'WalletChanged' });
        }

        const wardId = await dispatch(ensureContactsWardIdThunk({ contactsDevice })).unwrap();

        if (!wardId.success) {
            return wardId;
        }

        if (!isSelectedContactsDevice(getState(), contactsDevice)) {
            return err({ type: 'WalletChanged' });
        }

        const { staticSessionId } = contactsDevice;
        const change =
            name === undefined ? { delete: true } : { valueHex: getContactNameValueHex(name) };
        const response = await TrezorConnect.wardUpdate({
            device: getConnectDevice(contactsDevice),
            appId: CONTACT_WARD_APP_ID,
            address: npub,
            networkSymbol: CONTACT_WARD_NETWORK_SYMBOL,
            metadata: {},
            ...change,
            wardId: wardId.payload,
        });

        if (!response.success) {
            const error = getContactsErrorFromConnect(response.error);

            if (isWardIdMismatch(error)) {
                dispatch(contactsActions.clearWardId({ staticSessionId }));
            }

            return err(error);
        }

        if (response.payload.conflict) {
            return err({ type: 'WardConflict' });
        }

        const status: ContactWardStatus = response.payload.queued ? 'queued' : 'written';
        dispatch(contactsActions.setWardStatus({ staticSessionId, npub, status }));

        return ok(status);
    },
);

type AddContactThunkParams = {
    /** As typed or pasted. */
    npub: string;
    name: string;
};

type AddContactThunkState = ContactsThunkState;

type AddContactThunkDeps = ContactsThunkDeps;

/**
 * Adds a contact the wallet can pay by name: the Trezor confirms the name for the npub and keeps
 * it in its WARD, then Suite Sync keeps it for every Suite of the wallet.
 */
export const addContactThunk = createThunk<
    Result<ContactWardStatus, ContactsError>,
    AddContactThunkParams,
    { state: AddContactThunkState; extra: AddContactThunkDeps }
>(`${CONTACTS_ACTION_PREFIX}/addContactThunk`, async (params, { dispatch, getState, extra }) => {
    const payerDevice = getPayerDevice(getState());

    if (!payerDevice.success) {
        return payerDevice;
    }

    const npub = parseNpub(params.npub);

    if (!npub.success) {
        return err({ type: 'InvalidNpub' });
    }

    const name = validateContactName(params.name);

    if (!name.success) {
        return err({ type: 'InvalidName', reason: name.error });
    }

    const { staticSessionId } = payerDevice.payload;

    if (findContact(getState(), staticSessionId, npub.payload)) {
        return err({ type: 'DuplicateContact' });
    }

    const ownNpub = await dispatch(
        ensureContactIdentityThunk({ contactsDevice: payerDevice.payload }),
    ).unwrap();

    if (!ownNpub.success) {
        return ownNpub;
    }

    if (ownNpub.payload === npub.payload) {
        return err({ type: 'OwnNpub' });
    }

    const storage = await ensureContactsStorage(extra, staticSessionId);

    if (!storage.success) {
        return storage;
    }

    const written = await dispatch(
        writeContactToWardThunk({
            contactsDevice: payerDevice.payload,
            npub: npub.payload,
            name: name.payload,
        }),
    ).unwrap();

    if (!written.success) {
        return written;
    }

    const stored = storage.payload.data.contacts.update({ npub: npub.payload, name: name.payload });

    if (!stored.success) {
        return err({ type: 'SuiteSyncFailed', error: stored.error });
    }

    return written;
});

type ContactThunkParams = {
    npub: string;
};

type RemoveContactThunkState = ContactsThunkState;

type RemoveContactThunkDeps = ContactsThunkDeps;

/** Deletes the contact's WARD entry (the Trezor confirms it), then the contact itself. */
export const removeContactThunk = createThunk<
    Result<ContactWardStatus, ContactsError>,
    ContactThunkParams,
    { state: RemoveContactThunkState; extra: RemoveContactThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/removeContactThunk`,
    async ({ npub }, { dispatch, getState, extra }) => {
        const payerDevice = getPayerDevice(getState());

        if (!payerDevice.success) {
            return payerDevice;
        }

        const { staticSessionId } = payerDevice.payload;

        if (!findContact(getState(), staticSessionId, npub)) {
            return err({ type: 'UnknownContact' });
        }

        const storage = await ensureContactsStorage(extra, staticSessionId);

        if (!storage.success) {
            return storage;
        }

        const deleted = await dispatch(
            writeContactToWardThunk({ contactsDevice: payerDevice.payload, npub, name: undefined }),
        ).unwrap();

        if (!deleted.success) {
            return deleted;
        }

        dispatch(contactsActions.setWardStatus({ staticSessionId, npub, status: undefined }));
        const stored = storage.payload.data.contacts.update({ npub, isDeleted: true });

        if (!stored.success) {
            return err({ type: 'SuiteSyncFailed', error: stored.error });
        }

        return deleted;
    },
);

type WriteContactToTrezorThunkState = ContactsThunkState;

/**
 * Writes a contact's name to the Trezor again, e.g. after its WARD was reset; the contact itself
 * stays as it is in Suite Sync.
 */
export const writeContactToTrezorThunk = createThunk<
    Result<ContactWardStatus, ContactsError>,
    ContactThunkParams,
    { state: WriteContactToTrezorThunkState }
>(
    `${CONTACTS_ACTION_PREFIX}/writeContactToTrezorThunk`,
    async ({ npub }, { dispatch, getState }) => {
        const payerDevice = getPayerDevice(getState());

        if (!payerDevice.success) {
            return payerDevice;
        }

        const contact = findContact(getState(), payerDevice.payload.staticSessionId, npub);

        if (!contact) {
            return err({ type: 'UnknownContact' });
        }

        const written = await dispatch(
            writeContactToWardThunk({
                contactsDevice: payerDevice.payload,
                npub,
                name: contact.name,
            }),
        ).unwrap();

        return written;
    },
);

type ShowContactOnTrezorThunkState = ContactsThunkState;

/** Shows the contact's npub on the Trezor together with the name its WARD holds for it. */
export const showContactOnTrezorThunk = createThunk<
    Result<void, ContactsError>,
    ContactThunkParams,
    { state: ShowContactOnTrezorThunkState }
>(
    `${CONTACTS_ACTION_PREFIX}/showContactOnTrezorThunk`,
    async ({ npub }, { dispatch, getState }) => {
        const payerDevice = getPayerDevice(getState());

        if (!payerDevice.success) {
            return payerDevice;
        }

        const wardId = await dispatch(
            ensureContactsWardIdThunk({ contactsDevice: payerDevice.payload }),
        ).unwrap();

        if (!wardId.success) {
            return wardId;
        }

        const response = await TrezorConnect.wardDisplayAddress({
            device: getConnectDevice(payerDevice.payload),
            appId: CONTACT_WARD_APP_ID,
            address: npub,
            networkSymbol: CONTACT_WARD_NETWORK_SYMBOL,
            wardId: wardId.payload,
        });

        if (!response.success) {
            const error = getContactsErrorFromConnect(response.error);

            if (isWardIdMismatch(error)) {
                dispatch(
                    contactsActions.clearWardId({
                        staticSessionId: payerDevice.payload.staticSessionId,
                    }),
                );
            }

            return err(error);
        }

        return ok();
    },
);
