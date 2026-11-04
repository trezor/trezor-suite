import { type MMKV, deleteMMKV } from 'react-native-mmkv';

import { captureMessage } from '@sentry/react-native';

import { unecryptedJotaiStorage } from './atomWithUnecryptedStorage';
import { ENCRYPTED_STORAGE_ID } from './mmkvStorage';

type ClearStorageParams = {
    mmkvInstance: MMKV | null;
};

export type ClearStorage = (params: ClearStorageParams) => void;

export type ClearStorageDep = { clearStorage: ClearStorage };

/**
 * Wipes all persisted app data. Pass `null` when the encrypted storage never opened.
 */
export const clearStorage: ClearStorage = ({ mmkvInstance }) => {
    captureMessage('User triggered Clear App Storage action.', 'error');
    unecryptedJotaiStorage.clearAll();

    if (mmkvInstance === null) {
        // Storage that failed to open has no instance to clear, so its files are deleted instead.
        // MMKV destroys an open instance it deletes, which is why an open one is only cleared.
        deleteMMKV(ENCRYPTED_STORAGE_ID);
    } else {
        mmkvInstance.clearAll();
    }
};
