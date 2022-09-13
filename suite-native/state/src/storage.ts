import { MMKV } from 'react-native-mmkv';

import { Storage } from 'redux-persist';

const storage = new MMKV({
    id: 'trezorSuite-app-storage',
    encryptionKey: 'iGuessWeShouldEncryptMMKVFromGithubENV', // FIXME
});

export const reduxStorage: Storage = {
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
