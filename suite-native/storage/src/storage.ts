import { MMKV } from 'react-native-mmkv';
import { Alert, NativeModules } from 'react-native';

import * as Random from 'expo-random';
import * as SecureStore from 'expo-secure-store';
import { Persistor, Storage } from 'redux-persist';
import * as SplashScreen from 'expo-splash-screen';

const ENCRYPTION_KEY = 'STORAGE_ENCRYPTION_KEY';
const ENCRYPTED_STORAGE_ID = 'trezorSuite-app-storage';

export const purgeStorage = async (persistor: Persistor) => {
    await persistor.purge();
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
    NativeModules.DevSettings.reload();
};

export const retrieveStorageEncryptionKey = async () => {
    let secureKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);

    if (secureKey == null) {
        secureKey = Buffer.from(Random.getRandomBytes(16)).toString('hex');
        await SecureStore.setItemAsync(ENCRYPTION_KEY, secureKey);
    }

    return secureKey;
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
            `Storage is corrupted. Please reinstall the app. \n Error: ${error.toString()}`,
        );
        // rethrow error so it can be caught by Sentry
        throw error;
    }
};

export const initMmkvStorage = async (): Promise<Storage> => {
    const encryptionKey = await retrieveStorageEncryptionKey();

    const encryptedStorage = tryInitStorage(encryptionKey);

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
