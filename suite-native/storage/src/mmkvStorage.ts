import { type MMKV, type createMMKV } from 'react-native-mmkv';

import { type Storage } from 'redux-persist';

import { type EnsureEncryptionKeyDep } from './createEnsureEncryptionKey';

export const ENCRYPTED_STORAGE_ID = 'trezorSuite-app-storage';

export type MMKVStorageDeps = EnsureEncryptionKeyDep & {
    createMMKV: typeof createMMKV;
};

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
            throw new Error('Encryption key is unreadable!');
        }

        // Another caller may have initialized storage while we awaited the encryption key.
        mmkv ??= deps.createMMKV({
            id: ENCRYPTED_STORAGE_ID,
            encryptionKey,
        });

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
