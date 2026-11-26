import {
    type DeviceRootState,
    selectIsDeviceUsingPassphrase,
    selectSelectedDevice,
} from '@suite-common/device';
import { type SuiteSyncDataRootState, selectSuiteSyncContacts } from '@suite-common/suite-sync';
import { type SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnDep } from '@suite-common/suite-sync-types';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { type WithServices } from '@trezor/redux-utils';
import { type Result, err, ok } from '@trezor/type-utils';

import { type ContactsError } from './contactsErrors';

export const CONTACTS_ACTION_PREFIX = '@suite-common/contacts';

/** NIP-06: the key the Trezor derives the contact identity (npub) from. */
export const CONTACTS_IDENTITY_PATH = "m/44'/1237'/0'/0/0";

export type ContactsDevice = {
    device: AcquiredDevice;
    staticSessionId: StaticSessionId;
};

export const getContactsDevice = (
    state: DeviceRootState,
): Result<ContactsDevice, ContactsError> => {
    const device = selectSelectedDevice(state);
    const staticSessionId = device?.state?.staticSessionId;

    if (device?.type !== 'acquired' || !device.connected || staticSessionId === undefined) {
        return err({ type: 'NoDevice' });
    }

    return ok({ device, staticSessionId });
};

/**
 * Whether the wallet a change started for is still the selected one. Contact changes go to the
 * Trezor's WARD and to the wallet's Suite Sync, and both must be the same wallet's.
 */
export const isSelectedContactsDevice = (
    state: DeviceRootState,
    { staticSessionId }: ContactsDevice,
) => {
    const selected = getContactsDevice(state);

    return selected.success && selected.payload.staticSessionId === staticSessionId;
};

// WARD runs with an empty passphrase, so only the standard wallet's contacts reach its Trezor.
export const getPayerDevice = (state: DeviceRootState): Result<ContactsDevice, ContactsError> => {
    const contactsDevice = getContactsDevice(state);

    if (contactsDevice.success && selectIsDeviceUsingPassphrase(state)) {
        return err({ type: 'PassphraseWallet' });
    }

    return contactsDevice;
};

export const getConnectDevice = ({ device }: ContactsDevice) => ({
    path: device.path,
    instance: device.instance,
    state: device.state,
    useEmptyPassphrase: device.useEmptyPassphrase,
});

export const findContact = (
    state: SuiteSyncDataRootState,
    staticSessionId: StaticSessionId,
    npub: string,
) =>
    selectSuiteSyncContacts(state, parseStaticSessionId(staticSessionId).walletDescriptor).find(
        contact => contact.npub === npub,
    );

export type ContactsStorageDeps = WithServices<{ suiteSync: EnsureWalletSuiteSyncOnDep }>;

export const ensureContactsStorage = async (
    extra: ContactsStorageDeps,
    staticSessionId: StaticSessionId,
): Promise<Result<SuiteSyncStorage, ContactsError>> => {
    const storage = await extra.services.suiteSync.ensureWalletSuiteSyncOn({
        deviceStaticSessionId: staticSessionId,
        isWriteMode: true,
    });

    return storage.success ? storage : err({ type: 'SuiteSyncFailed', error: storage.error });
};
