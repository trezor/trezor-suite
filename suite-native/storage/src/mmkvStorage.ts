import { Alert } from 'react-native';
import { MMKV, createMMKV } from 'react-native-mmkv';
import RNRestart from 'react-native-restart';

import { captureMessage } from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Storage } from 'redux-persist';

import { unecryptedJotaiStorage } from './atomWithUnecryptedStorage';
import { EnsureMMKVKeyDep } from './ensureMMKVKey';

export const ENCRYPTED_STORAGE_ID = 'trezorSuite-app-storage';

export const clearStorage = () => {
    captureMessage('User triggered Clear App Storage action.', 'error');
    unecryptedJotaiStorage.clearAll();
    // encryptedStorage?.clearAll(); // Todo: figure out!
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

type GetMMKVRaw = {
    getMMKV: () => Promise<MMKV>;
};
export type MMKVStorage = Storage & GetMMKVRaw;
export type MMKVStorageDep = { mmkvStorage: MMKVStorage };

type CreateMMKVStorageDeps = EnsureMMKVKeyDep;

export const createMMKVStorage = (deps: CreateMMKVStorageDeps): MMKVStorage => {
    let mmkvAndKey: { mmkv: MMKV; encryptionKey: string } | null = null;

    const ensureMMKV = async () => {
        if (mmkvAndKey !== null) {
            return mmkvAndKey;
        }

        // storage may be already initialized (for example in dev useEffect fire twice)
        const encryptionKey = await deps.ensureMMKVKey();

        if (encryptionKey === null) {
            alertUser();
            throw new Error('Encryption key is unreadable!');
        }

        mmkvAndKey = {
            mmkv: tryInitStorage(encryptionKey),
            encryptionKey,
        };

        return mmkvAndKey;
    };

    return {
        getMMKV: async () => (await ensureMMKV()).mmkv,
        setItem: async (key, value) => {
            (await ensureMMKV()).mmkv.set(key, value);

            return true;
        },
        getItem: async key => (await ensureMMKV()).mmkv.getString(key),
        removeItem: async key => {
            (await ensureMMKV()).mmkv.remove(key);
        },
    };
};
