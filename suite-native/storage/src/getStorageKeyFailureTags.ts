import { AppState } from 'react-native';

export type StorageKeyFailure =
    'read-threw' | 'read-null-with-existing-data' | 'set-failed' | 'delete-failed';

/**
 * Sentry tags that tell storage encryption key failures apart. Never add the key or other
 * confidential data here.
 */
export const getStorageKeyFailureTags = (storageKeyFailure: StorageKeyFailure) => ({
    storageKeyFailure,
    appState: AppState.currentState,
});
