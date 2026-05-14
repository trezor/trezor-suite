import { Alert } from 'react-native';
import { type MMKV, createMMKV } from 'react-native-mmkv';
import RNRestart from 'react-native-restart';

import { captureMessage } from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { type Storage } from 'redux-persist';

import { unecryptedJotaiStorage } from './atomWithUnecryptedStorage';
import { type EnsureEncryptionKeyDep } from './createEnsureEncryptionKey';

export const ENCRYPTED_STORAGE_ID = 'trezorSuite-app-storage';

export const clearStorage = ({ mmkvInstance }: { mmkvInstance: MMKV | null }) => {
    captureMessage('User triggered Clear App Storage action.', 'error');
    unecryptedJotaiStorage.clearAll();
    mmkvInstance?.clearAll();
    RNRestart.restart();
};

const alertUser = ({ mmkvInstance }: { mmkvInstance: MMKV | null }) => {
    // If storage can't load, app is never set as ready so we need to hide splash screen here to make the alert visible.
    SplashScreen.hideAsync();
    Alert.alert(
        'Unable to load app data',
        'Try restarting the app. If the issue persists, you may need to clear the app’s storage. This won’t affect assets on your Trezor device.',
        [
            {
                text: 'Clear app storage',
                onPress: () => clearStorage({ mmkvInstance }),
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
        alertUser({ mmkvInstance: null });
        // rethrow error so it can be caught by Sentry
        throw error;
    }
};

type GetMMKVRaw = {
    getMMKV: () => Promise<MMKV>;
};
export type MMKVStorage = Storage & GetMMKVRaw;
export type MMKVStorageDep = { mmkvStorage: MMKVStorage };

type CreateMMKVStorageDeps = EnsureEncryptionKeyDep;

export const createMMKVStorage = (deps: CreateMMKVStorageDeps): MMKVStorage => {
    let mmkv: MMKV | null = null;

    const ensureMMKV = async () => {
        if (mmkv !== null) {
            return mmkv;
        }

        // storage may be already initialized (for example in dev useEffect fire twice)
        const encryptionKey = await deps.ensureEncryptionKey();

        if (encryptionKey === null) {
            alertUser({ mmkvInstance: mmkv });
            throw new Error('Encryption key is unreadable!');
        }

        mmkv = tryInitStorage(encryptionKey);

        return mmkv;
    };

    return {
        getMMKV: async () => await ensureMMKV(),
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
