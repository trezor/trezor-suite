import { MMKV } from 'react-native-mmkv';
import { NativeModules } from 'react-native';

import * as Random from 'expo-random';
import * as SecureStore from 'expo-secure-store';
import { Persistor, Storage } from 'redux-persist';

const ENCRYPTION_KEY = 'STORAGE_ENCRYPTION_KEY';

export const purgeStorage = async (persistor: Persistor) => {
    await persistor.purge();
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
    NativeModules.DevSettings.reload();
};

const retrieveStorageEncryptionKey = async () => {
    let secureKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);

    if (secureKey == null) {
        secureKey = Buffer.from(Random.getRandomBytes(16)).toString('hex');
        await SecureStore.setItemAsync(ENCRYPTION_KEY, secureKey);
    }

    return secureKey;
};

export const initMmkvStorage = async (): Promise<Storage> => {
    const encryptionKey = await retrieveStorageEncryptionKey();

    const storage = new MMKV({
        id: 'trezorSuite-app-storage',
        encryptionKey,
    });

    return {
        setItem: (key, value) => {
            storage.set(key, value);
            return Promise.resolve(true);
        },
        getItem: key => {
            const value = storage.getString(key);
            return Promise.resolve(value);
        },
        removeItem: key => {
            storage.delete(key);
            return Promise.resolve();
        },
    };
};
