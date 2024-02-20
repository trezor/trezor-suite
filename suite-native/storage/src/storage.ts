import { Alert } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import RNRestart from 'react-native-restart';

import * as Random from 'expo-random';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { Storage } from 'redux-persist';

import { unecryptedJotaiStorage } from './atomWithUnecryptedStorage';

export const ENCRYPTION_KEY = 'STORAGE_ENCRYPTION_KEY';
export const ENCRYPTED_STORAGE_ID = 'trezorSuite-app-storage';

export const retrieveStorageEncryptionKey = async () => {
    let secureKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);

    if (secureKey == null) {
        secureKey = Buffer.from(Random.getRandomBytes(16)).toString('hex');
        await SecureStore.setItemAsync(ENCRYPTION_KEY, secureKey);
    }

    return secureKey;
};

export let encryptedStorage: MMKV;

export const clearStorage = () => {
    unecryptedJotaiStorage.clearAll();
    encryptedStorage?.clearAll();
    RNRestart.restart();
};

// Ideally it should never happen but we need to be sure that at least some message is displayed.
// If someone will mess with encryptionKey it can corrupt storage and app will crash on startup.
// Then app will hang on splashscreen indefinitely so we at least want to show some error message.
const tryInitStorage = (encryptionKey: string) => {
    // storage may be already initialized (for example in dev useEffect fire twice)
    if (encryptedStorage) return encryptedStorage;

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
    const encryptionKey = await retrieveStorageEncryptionKey();

    encryptedStorage = tryInitStorage(encryptionKey);

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
