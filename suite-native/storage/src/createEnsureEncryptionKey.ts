export const ENCRYPTION_KEY = 'STORAGE_ENCRYPTION_KEY';
import { captureException } from '@sentry/react-native';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { type Branded } from '@trezor/type-utils';

export type StorageEncryptionKey = string & Branded<'StorageEncryptionKey'>;

export type EnsureEncryptionKey = () => Promise<StorageEncryptionKey | null>;

export type EnsureEncryptionKeyDep = {
    ensureEncryptionKey: EnsureEncryptionKey;
};

// This key decrypts the whole encrypted MMKV store, which persists confidential device data
// (device state / static session id, label, id — see `devicePersistTransform`). Without an explicit
// accessibility option expo-secure-store defaults to `WHEN_UNLOCKED`, which is included in encrypted
// device backups and MIGRATES to a new device on restore — so anyone able to restore a backup would
// obtain both the encrypted store and the key that decrypts it. `*_THIS_DEVICE_ONLY` blocks that
// backup/device-migration extraction. We use `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (not
// `WHEN_UNLOCKED_THIS_DEVICE_ONLY`) so the key stays readable in the background after the first
// unlock even while the phone is locked, which the read paths below rely on.
const secureStoreOptions: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const resolveEncryptionKey = (): Promise<StorageEncryptionKey | null> =>
    SecureStore.getItemAsync(ENCRYPTION_KEY, secureStoreOptions)
        .catch(error => {
            // If there is an error, report it and try to read one more time.
            captureException(error, { tags: { attempt: 1 } });

            // There were some trouble reading from the SecureStore,
            // let's wait a bit to make sure it wasn't just temporary error.
            return new Promise(resolve => setTimeout(resolve, 100))
                .then(() => SecureStore.getItemAsync(ENCRYPTION_KEY, secureStoreOptions))
                .catch(errorOnGet => {
                    captureException(errorOnGet, { tags: { attempt: 2 } });

                    // It's not possible to read from SecureStore,
                    // and we don't want to set a new key or reset storage without user interaction.
                    // It might happen on the background when the phone is locked.
                    return null;
                });
        })
        .then(secureKey => {
            if (secureKey != null) return secureKey as StorageEncryptionKey;

            // If we are here, it means that we have no encryption key in storage.
            // We need to generate a new one. This should happen only once on first app start.
            const newSecureKey = Buffer.from(getRandomBytes(16)).toString(
                'hex',
            ) as StorageEncryptionKey;

            return SecureStore.setItemAsync(ENCRYPTION_KEY, newSecureKey, secureStoreOptions)
                .then(() => newSecureKey)
                .catch(err => {
                    captureException(err);

                    return null;
                });
        });

export const createEnsureEncryptionKey = (): EnsureEncryptionKey => {
    let secureKeyPromise: Promise<StorageEncryptionKey | null> | null = null;

    return () => {
        secureKeyPromise ??= resolveEncryptionKey();

        return secureKeyPromise;
    };
};
