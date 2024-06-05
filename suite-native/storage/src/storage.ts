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
    try {
        const secureKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);

        if (secureKey) return secureKey;
    } catch (error) {
        // Some users are facing an error when they uninstall the app and then reinstall it,
        // see https://github.com/expo/expo/issues/23426
        await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
        captureException(error);
    }

    const secureKey = Buffer.from(getRandomBytes(16)).toString('hex');
    await SecureStore.setItemAsync(ENCRYPTION_KEY, secureKey);

    return secureKey;
};

export const clearStorage = () => {
    unecryptedJotaiStorage.clearAll();
    encryptedStorage?.clearAll();
    RNRestart.restart();
};

// Ideally it should never happen but we need to be sure that at least some message is displayed.
// If someone will mess with encryptionKey it can corrupt storage and app will crash on startup.
// Then app will hang on splashscreen indefinitely so we at least want to show some error message.
const tryInitStorage = (encryptionKey: string) => {
    try {
        return new MMKV({
            id: ENCRYPTED_STORAGE_ID,
            encryptionKey,
        });
    } catch (error) {
        SplashScreen.hideAsync();
        Alert.alert(
            'Encrypted storage error',
            `Storage is corrupted. Please reinstall the app or reset storage. \n Error: ${error.toString()}`,
            [
                {
                    text: 'OK',
                    onPress: () => {
                        // do nothing
                    },
                },
                {
                    text: 'Reset storage',
                    onPress: clearStorage,
                },
            ],
        );
        // rethrow error so it can be caught by Sentry
        throw error;
    }
};

export const initMmkvStorage = async (): Promise<Storage> => {
    // storage may be already initialized (for example in dev useEffect fire twice)
    if (!encryptedStorage) {
        const encryptionKey = await retrieveStorageEncryptionKey();
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
