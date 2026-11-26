import {
    type DeviceRootState,
    selectIsDeviceRemembered,
    selectIsDeviceUsingPassphrase,
    selectSelectedDevice,
} from '@suite-common/device';
import { receiveActions } from '@suite-common/receive';
import { type SuiteSyncDataRootState } from '@suite-common/suite-sync';
import {
    type AccountsRootState,
    type ContactOutputAttestation,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAddressDisplayType,
} from '@suite-common/wallet-core';
import { type AccountKey, AddressDisplayOptions } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { createThunk } from '@trezor/redux-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import { type ContactAddressShare, parseContactAddressShare } from './contactAddressShare';
import { verifyContactAttestation } from './contactAttestation';
import {
    type ContactPaymentsRootState,
    selectAccountContactAddresses,
    selectAccountContacts,
    selectAccountPaidAddresses,
} from './contactPaymentSelectors';
import { CONTACTS_SLIP44S, getContactOutputs, getContactsSlip44 } from './contactPayments';
import { type ContactsError, getContactsErrorFromConnect } from './contactsErrors';
import {
    CONTACTS_ACTION_PREFIX,
    type ContactsStorageDeps,
    ensureContactsStorage,
    findContact,
    getConnectDevice,
    getContactsDevice,
    getPayerDevice,
} from './contactsThunkHelpers';
import { encodeNpub } from './npub';

type AddContactAddressThunkParams = {
    npub: string;
    /** The contact's address share, as pasted. */
    text: string;
};

type AddContactAddressThunkState = DeviceRootState & SuiteSyncDataRootState;

type AddContactAddressThunkDeps = ContactsStorageDeps;

/** Keeps an address the contact's Trezor attested, for the wallet to pay the contact by name. */
export const addContactAddressThunk = createThunk<
    Result<ContactAddressShare, ContactsError>,
    AddContactAddressThunkParams,
    { state: AddContactAddressThunkState; extra: AddContactAddressThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/addContactAddressThunk`,
    async ({ npub, text }, { getState, extra }) => {
        const payerDevice = getPayerDevice(getState());

        if (!payerDevice.success) {
            return payerDevice;
        }

        const { staticSessionId } = payerDevice.payload;

        if (!findContact(getState(), staticSessionId, npub)) {
            return err({ type: 'UnknownContact' });
        }

        const share = parseContactAddressShare(text);

        if (!share.success) {
            return err({ type: 'InvalidAddressShare', reason: share.error });
        }

        if (share.payload.npub !== npub) {
            return err({ type: 'OtherContactAddress' });
        }

        const { slip44, address, signature } = share.payload;

        if (!CONTACTS_SLIP44S.includes(slip44)) {
            return err({ type: 'InvalidAddressShare', reason: 'UnsupportedNetwork' });
        }

        const storage = await ensureContactsStorage(extra, staticSessionId);

        if (!storage.success) {
            return storage;
        }

        // No paid flag: this Suite may not see yet that the address was paid, and the table never
        // turns a paid address back into an unpaid one.
        const stored = storage.payload.data.contactAddresses.update({
            npub,
            slip44,
            address,
            signature,
        });

        if (!stored.success) {
            return err({ type: 'SuiteSyncFailed', error: stored.error });
        }

        return share;
    },
);

type AttestContactAddressThunkParams = {
    accountKey: AccountKey;
    path: string;
    address: string;
};

export type AttestContactAddressThunkState = DeviceRootState &
    AccountsRootState &
    WalletSettingsRootState;

/**
 * Has the Trezor show a receive address and, once the user agrees to share it, attest it with the
 * wallet's contact identity. The address then counts as handed out, so it is not shared again.
 */
export const attestContactAddressThunk = createThunk<
    Result<ContactAddressShare, ContactsError>,
    AttestContactAddressThunkParams,
    { state: AttestContactAddressThunkState }
>(
    `${CONTACTS_ACTION_PREFIX}/attestContactAddressThunk`,
    async ({ accountKey, path, address }, { dispatch, getState }) => {
        const contactsDevice = getContactsDevice(getState());

        if (!contactsDevice.success) {
            return contactsDevice;
        }

        // Suite keeps the addresses it handed out only for a remembered wallet.
        if (!selectIsDeviceRemembered(getState())) {
            return err({ type: 'WalletNotRemembered' });
        }

        const account = selectAccountByKey(getState(), accountKey);
        const slip44 = account ? getContactsSlip44(account) : undefined;

        if (
            !account ||
            slip44 === undefined ||
            account.deviceState !== contactsDevice.payload.staticSessionId
        ) {
            return err({ type: 'UnsupportedAccount' });
        }

        const response = await TrezorConnect.getAddress({
            device: getConnectDevice(contactsDevice.payload),
            path,
            coin: asCoinSymbol(account.symbol),
            unlockPath: account.unlockPath,
            showOnTrezor: true,
            chunkify: selectAddressDisplayType(getState()) === AddressDisplayOptions.CHUNKED,
            contactAttestation: true,
        });

        if (!response.success) {
            return err(getContactsErrorFromConnect(response.error));
        }

        const { contactPubkey, contactSignature } = response.payload;

        if (response.payload.address !== address) {
            return err({ type: 'DeviceFailed', message: 'The Trezor returned another address' });
        }

        // The Trezor shows the address but attests none it may not: e.g. beyond its index limit.
        if (contactPubkey === undefined || contactSignature === undefined) {
            return err({ type: 'NotAttested' });
        }

        const attestation = { pubkey: contactPubkey, slip44, address, signature: contactSignature };
        const npub = encodeNpub(contactPubkey);

        if (!npub.success || !verifyContactAttestation(attestation)) {
            return err({ type: 'NotAttested' });
        }

        dispatch(receiveActions.touchAddress({ accountKey, path, address }));

        return ok({ ...attestation, npub: npub.payload });
    },
);

type GetContactOutputsThunkParams = {
    accountKey: AccountKey;
    outputAddresses: string[];
};

export type GetContactOutputsThunkState = DeviceRootState & ContactPaymentsRootState;

/**
 * The contact attestations for a transaction's outputs, checked again right before signing: the
 * wallet may have paid an address since it was picked, e.g. from another Suite.
 */
export const getContactOutputsThunk = createThunk<
    Result<ContactOutputAttestation[], ContactsError>,
    GetContactOutputsThunkParams,
    { state: GetContactOutputsThunkState }
>(
    `${CONTACTS_ACTION_PREFIX}/getContactOutputsThunk`,
    ({ accountKey, outputAddresses }, { getState }) => {
        const account = selectAccountByKey(getState(), accountKey);
        const slip44 = account ? getContactsSlip44(account) : undefined;
        const signingWallet = selectSelectedDevice(getState())?.state?.staticSessionId;

        // Only the standard wallet's Trezor keeps contacts in its WARD.
        if (
            !account ||
            slip44 === undefined ||
            account.deviceState !== signingWallet ||
            selectIsDeviceUsingPassphrase(getState())
        ) {
            return ok([]);
        }

        const contactOutputs = getContactOutputs({
            outputAddresses,
            contacts: selectAccountContacts(getState(), accountKey),
            contactAddresses: selectAccountContactAddresses(getState(), accountKey),
            slip44,
            paidAddresses: selectAccountPaidAddresses(getState(), accountKey),
        });

        return contactOutputs.success ? contactOutputs : err({ type: contactOutputs.error });
    },
);

type MarkContactAddressesSpentThunkParams = {
    accountKey: AccountKey;
    addresses: string[];
};

export type MarkContactAddressesSpentThunkState = ContactPaymentsRootState;

export type MarkContactAddressesSpentThunkDeps = ContactsStorageDeps;

/**
 * Marks paid contact addresses in Suite Sync, so no account of the wallet pays them again. The
 * account's own transactions already show the payment, but those of other accounts do not.
 */
export const markContactAddressesSpentThunk = createThunk<
    Result<void, ContactsError>,
    MarkContactAddressesSpentThunkParams,
    { state: MarkContactAddressesSpentThunkState; extra: MarkContactAddressesSpentThunkDeps }
>(
    `${CONTACTS_ACTION_PREFIX}/markContactAddressesSpentThunk`,
    async ({ accountKey, addresses }, { getState, extra }) => {
        const account = selectAccountByKey(getState(), accountKey);
        const slip44 = account ? getContactsSlip44(account) : undefined;

        if (!account || slip44 === undefined) {
            return ok();
        }

        const paidContactAddresses = selectAccountContactAddresses(getState(), accountKey).filter(
            contactAddress =>
                contactAddress.slip44 === slip44 &&
                !contactAddress.isSpent &&
                addresses.includes(contactAddress.address),
        );

        if (paidContactAddresses.length === 0) {
            return ok();
        }

        const storage = await ensureContactsStorage(extra, account.deviceState);

        if (!storage.success) {
            return storage;
        }

        for (const contactAddress of paidContactAddresses) {
            const stored = storage.payload.data.contactAddresses.update({
                ...contactAddress,
                isSpent: true,
            });

            if (!stored.success) {
                return err({ type: 'SuiteSyncFailed', error: stored.error });
            }
        }

        return ok();
    },
);
