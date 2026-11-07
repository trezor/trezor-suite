export const ENCRYPTION_KEY = 'STORAGE_ENCRYPTION_KEY';
import { AppState } from 'react-native';
import { existsMMKV } from 'react-native-mmkv';

import { captureException } from '@sentry/react-native';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { type Branded } from '@trezor/type-utils';

import { ENCRYPTED_STORAGE_ID } from './encryptedStorageId';
import { getStorageKeyFailureTags } from './getStorageKeyFailureTags';
import { waitForActiveAppState } from './waitForActiveAppState';

export type StorageEncryptionKey = string & Branded<'StorageEncryptionKey'>;

export type EnsureEncryptionKey = () => Promise<StorageEncryptionKey | null>;

export type EnsureEncryptionKeyDep = {
    ensureEncryptionKey: EnsureEncryptionKey;
};

const resolveEncryptionKey = (): Promise<StorageEncryptionKey | null> =>
    SecureStore.getItemAsync(ENCRYPTION_KEY)
        .catch(error => {
            // If there is an error, report it and try to read one more time.
            captureException(error, {
                tags: { ...getStorageKeyFailureTags('read-threw'), attempt: 1 },
            });

            // There were some trouble reading from the SecureStore,
            // let's wait a bit to make sure it wasn't just temporary error.
            return new Promise(resolve => setTimeout(resolve, 100))
                .then(() => SecureStore.getItemAsync(ENCRYPTION_KEY))
                .catch(errorOnGet => {
                    captureException(errorOnGet, {
                        tags: { ...getStorageKeyFailureTags('read-threw'), attempt: 2 },
                        // Sentry Dedupe drops an event equal to the previously sent one and ignores
                        // tags. iOS keychain errors have no stack frames, so attempt 2 would be
                        // dropped as a copy of attempt 1. A fingerprint on this event alone makes
                        // them differ, and '{{ default }}' keeps the server-side grouping as is.
                        fingerprint: ['{{ default }}'],
                    });

                    // It's not possible to read from SecureStore,
                    // and we don't want to set a new key or reset storage without user interaction.
                    // It might happen on the background when the phone is locked.
                    // Undefined distinguishes a failed read from SecureStore's null (key not found).
                    return undefined;
                });
        })
        .then(secureKey => {
            if (secureKey === undefined) return null;
            if (secureKey != null) return secureKey as StorageEncryptionKey;

            // The encrypted storage file is created on every successful start, so a missing key
            // next to it means the key was lost. A new key would let redux-persist overwrite the
            // unreadable data with defaults, so report it and leave recovery to the storage alert.
            if (existsMMKV(ENCRYPTED_STORAGE_ID)) {
                captureException(
                    new Error('Encryption key is missing for existing encrypted storage'),
                    { tags: getStorageKeyFailureTags('read-null-with-existing-data') },
                );

                return null;
            }

            // In background, the process can be suspended for minutes before a new key is written.
            // Decide on a read made while the app is active, so the key is written right after it.
            if (AppState.currentState !== 'active') {
                return waitForActiveAppState().then(resolveEncryptionKey);
            }

            // If we are here, it means that we have no encryption key in storage.
            // We need to generate a new one. This should happen only once on first app start.
            const newSecureKey = Buffer.from(getRandomBytes(16)).toString(
                'hex',
            ) as StorageEncryptionKey;

            return SecureStore.setItemAsync(ENCRYPTION_KEY, newSecureKey)
                .then(() => newSecureKey)
                .catch(err => {
                    captureException(err, { tags: getStorageKeyFailureTags('set-failed') });

                    return null;
                });
        });

export const createEnsureEncryptionKey = (): EnsureEncryptionKey => {
    let secureKeyPromise: Promise<StorageEncryptionKey | null> | null = null;

    return () => {
        // Concurrent callers share one read. Only a key is cached, because a key that is unavailable
        // now can become readable later, e.g. after the device is unlocked.
        secureKeyPromise ??= resolveEncryptionKey().then(secureKey => {
            if (secureKey === null) {
                secureKeyPromise = null;
            }

            return secureKey;
        });

        return secureKeyPromise;
    };
};
