import { Alert } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import RNRestart from 'react-native-restart';

import { captureException } from '@sentry/react-native';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { Storage } from 'redux-persist';

import { unecryptedJotaiStorage } from './atomWithUnecryptedStorage';

export const ENCRYPTION_KEY = 'STORAGE_ENCRYPTION_KEY';
export const ENCRYPTED_STORAGE_ID = 'trezorSuite-app-storage';

export let encryptedStorage: MMKV;

const retrieveStorageEncryptionKey = async () => {
    let secureKey: string | null = null;
    try {
        secureKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);
    } catch (error) {
        // If there is an error, report it and try to read one more time.
        captureException(error, { tags: { attempt: 1 } });
        try {
            // There were some trouble reading from the SecureStore,
            // let's wait a bit to make sure it wasn't just temporary error.
            await new Promise(resolve => setTimeout(resolve, 100));
            secureKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);
        } catch (error) {
            captureException(error, { tags: { attempt: 2 } });

            // It's not possible to read from SecureStore,
            // and we don't want to set a new key or reset storage without user interaction.
            // It might happen on the background when the phone is locked.
            return null;
        }
    }

    if (secureKey) return secureKey;

    // If we are here, it means that we have no encryption key in storage.
    // We need to generate a new one. This should happen only once on first app start.
    secureKey = Buffer.from(getRandomBytes(16)).toString('hex');
    await SecureStore.setItemAsync(ENCRYPTION_KEY, secureKey);

    return secureKey;
};

export const clearStorage = () => {
    unecryptedJotaiStorage.clearAll();
    encryptedStorage?.clearAll();
    RNRestart.restart();
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
                onPress: clearStorage,
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
    );
};

const tryInitStorage = (encryptionKey: string) => {
    try {
        return new MMKV({
            id: ENCRYPTED_STORAGE_ID,
            encryptionKey,
        });
    } catch (error) {
        alertUser();
        // rethrow error so it can be caught by Sentry
        throw error;
    }
};

export const initMmkvStorage = async (): Promise<Storage> => {
    // storage may be already initialized (for example in dev useEffect fire twice)
    if (!encryptedStorage) {
        const encryptionKey = await retrieveStorageEncryptionKey();

        if (!encryptionKey) {
            alertUser();
            throw new Error('Encryption key is unreadable!');
        }

        encryptedStorage = tryInitStorage(encryptionKey);
    }

    return {
        setItem: (key, value) => {
            encryptedStorage.set(key, value);

            return Promise.resolve(true);
        },
        getItem: key => {
            const value = encryptedStorage.getString(key);

            return Promise.resolve(value);
        },
        removeItem: key => {
            encryptedStorage.delete(key);

            return Promise.resolve();
        },
    };
};
