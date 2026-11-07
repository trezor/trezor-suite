import { Alert } from 'react-native';
import { type MMKV, createMMKV, deleteMMKV, existsMMKV } from 'react-native-mmkv';
import RNRestart from 'react-native-restart';

import { captureException, captureMessage, flush } from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { type Storage } from 'redux-persist';

import { unecryptedJotaiStorage } from './atomWithUnecryptedStorage';
import { ENCRYPTION_KEY, type EnsureEncryptionKeyDep } from './createEnsureEncryptionKey';
import { ENCRYPTED_STORAGE_ID } from './encryptedStorageId';

export const clearStorage = ({ mmkvInstance }: { mmkvInstance: MMKV | null }) => {
    captureMessage('User triggered Clear App Storage action.', 'error');
    unecryptedJotaiStorage.clearAll();
    mmkvInstance?.clearAll();
    RNRestart.restart();
};

const SENTRY_FLUSH_TIMEOUT_MS = 2000;

// The restart reloads the JS runtime and drops events that Sentry has not passed to the native SDK
// yet. Sentry's flush has no time limit of its own, so cap the wait to always reach the restart.
const flushSentryEvents = () =>
    Promise.race([flush(), new Promise(resolve => setTimeout(resolve, SENTRY_FLUSH_TIMEOUT_MS))]);

/**
 * Deletes the encrypted storage together with its key, so the next start begins with a new key.
 * Clearing the storage would not help when its key is missing or cannot open it.
 */
export const resetEncryptedStorage = async () => {
    captureMessage('User triggered Clear App Storage action.', 'error');

    try {
        deleteMMKV(ENCRYPTED_STORAGE_ID);

        // MMKV ignores errors when deleting the files, so report when the storage still exists.
        if (existsMMKV(ENCRYPTED_STORAGE_ID)) {
            captureException(new Error('Encrypted storage still exists after deletion'));
        }

        await SecureStore.deleteItemAsync(ENCRYPTION_KEY).catch(error => {
            captureException(error);
        });
        unecryptedJotaiStorage.clearAll();
    } catch (error) {
        captureException(error);
    } finally {
        await flushSentryEvents();
        // Restart even when deletion fails, so the user is not left without any screen.
        RNRestart.restart();
    }
};

type ConfirmStorageResetParams = {
    onCancel: () => void;
};

const confirmStorageReset = ({ onCancel }: ConfirmStorageResetParams) => {
    Alert.alert(
        'Clear app storage?',
        'This deletes the app data stored on this phone, including your wallets and settings. Funds on your Trezor device are not affected. You will need to add your wallets again.',
        [
            {
                text: 'Cancel',
                onPress: onCancel,
                style: 'cancel',
            },
            {
                text: 'Clear app storage',
                onPress: () => {
                    void resetEncryptedStorage();
                },
                style: 'destructive',
            },
        ],
        { cancelable: false },
    );
};

const alertUser = () => {
    // If storage can't load, app is never set as ready so we need to hide splash screen here to make the alert visible.
    SplashScreen.hideAsync();
    Alert.alert(
        'Unable to load app data',
        'Try restarting the app. If the issue persists, you may need to clear the app’s storage. This won’t affect assets on your Trezor device.',
        [
            {
                text: 'Clear app storage',
                onPress: () => confirmStorageReset({ onCancel: alertUser }),
                style: 'destructive',
            },
            {
                text: 'Restart app',
                onPress: () => {
                    RNRestart.restart();
                },
                isPreferred: true,
                style: 'default',
            },
        ],
        // Dismissing the alert would leave the user without any screen.
        { cancelable: false },
    );
};

const tryInitStorage = (encryptionKey: string) => {
    try {
        return createMMKV({
            id: ENCRYPTED_STORAGE_ID,
            encryptionKey,
        });
    } catch (error) {
        alertUser();
        // rethrow error so it can be caught by Sentry
        throw error;
    }
};

type MMKVStorageDeps = EnsureEncryptionKeyDep;

type GetMMKVRaw = {
    getMMKV: () => Promise<MMKV>;
};

export type MMKVStorage = Storage & GetMMKVRaw;

export type MMKVStorageDep = { mmkvStorage: MMKVStorage };

export const createMMKVStorage = (deps: MMKVStorageDeps): MMKVStorage => {
    let mmkv: MMKV | null = null;

    const ensureMMKV = async () => {
        if (mmkv !== null) {
            return mmkv;
        }

        const encryptionKey = await deps.ensureEncryptionKey();

        if (encryptionKey === null) {
            alertUser();
            throw new Error('Encryption key is unreadable!');
        }

        // Another caller may have initialized storage while we awaited the encryption key.
        mmkv ??= tryInitStorage(encryptionKey);

        return mmkv;
    };

    return {
        getMMKV: () => ensureMMKV(),
        setItem: async (key, value) => {
            (await ensureMMKV()).set(key, value);

            return true;
        },
        getItem: async key => (await ensureMMKV()).getString(key),
        removeItem: async key => {
            (await ensureMMKV()).remove(key);
        },
    };
};
