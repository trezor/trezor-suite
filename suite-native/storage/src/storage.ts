import { MMKV } from 'react-native-mmkv';
import { NativeModules } from 'react-native';

import * as Random from 'expo-random';
import * as SecureStore from 'expo-secure-store';
import { Persistor, Storage } from 'redux-persist';

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

export const initMmkvStorage = async (): Promise<Storage> => {
    const encryptionKey = await retrieveStorageEncryptionKey();

    const encryptedStorage = new MMKV({
        id: ENCRYPTED_STORAGE_ID,
        encryptionKey,
    });

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
