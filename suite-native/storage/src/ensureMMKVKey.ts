export const ENCRYPTION_KEY = 'STORAGE_ENCRYPTION_KEY';
import { captureException } from '@sentry/react-native';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { Branded } from '@trezor/type-utils';

export type MMKVStorageKey = string & Branded<'MMKVStorageKey'>;

export type EnsureMMKVKey = () => Promise<MMKVStorageKey | null>;

export type EnsureMMKVKeyDep = {
    ensureMMKVKey: EnsureMMKVKey;
};

export const createEnsureMMKVKey = (): EnsureMMKVKey => {
    const secureKeyPromise = SecureStore.getItemAsync(ENCRYPTION_KEY)
        .catch(error => {
            // If there is an error, report it and try to read one more time.
            captureException(error, { tags: { attempt: 1 } });

            // There were some trouble reading from the SecureStore,
            // let's wait a bit to make sure it wasn't just temporary error.
            return new Promise(resolve => setTimeout(resolve, 100))
                .then(() => SecureStore.getItemAsync(ENCRYPTION_KEY))
                .catch(errorOnGet => {
                    captureException(errorOnGet, { tags: { attempt: 2 } });

                    // It's not possible to read from SecureStore,
                    // and we don't want to set a new key or reset storage without user interaction.
                    // It might happen on the background when the phone is locked.
                    return null;
                });
        })
        .then(secureKey => {
            if (secureKey != null) return secureKey as MMKVStorageKey;

            // If we are here, it means that we have no encryption key in storage.
            // We need to generate a new one. This should happen only once on first app start.
            const newSecureKey = Buffer.from(getRandomBytes(16)).toString('hex') as MMKVStorageKey;

            return SecureStore.setItemAsync(ENCRYPTION_KEY, newSecureKey)
                .then(() => newSecureKey)
                .catch(err => {
                    captureException(err);

                    return null;
                });
        });

    return () => secureKeyPromise;
};
