import { deleteMMKV } from 'react-native-mmkv';

import { unecryptedJotaiStorage } from './atomWithUnecryptedStorage';
import { clearStorage } from './clearStorage';
import { ENCRYPTED_STORAGE_ID } from './mmkvStorage';
import { mockMMKV } from '../mocks/mockMMKV';

jest.mock('@sentry/react-native', () => ({ captureMessage: jest.fn() }));
// The library's deleteMMKV does nothing under Jest, so it is replaced to observe the call.
jest.mock('react-native-mmkv', () => ({
    ...jest.requireActual('react-native-mmkv'),
    deleteMMKV: jest.fn(() => true),
}));

describe('clearStorage', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('deletes encrypted storage that never opened', () => {
        clearStorage({ mmkvInstance: null });

        expect(deleteMMKV).toHaveBeenCalledTimes(1);
        expect(deleteMMKV).toHaveBeenCalledWith(ENCRYPTED_STORAGE_ID);
    });

    it('clears open encrypted storage instead of deleting it', () => {
        const mmkvInstance = mockMMKV();
        mmkvInstance.set('test-key', 'test-value');

        clearStorage({ mmkvInstance });

        expect(mmkvInstance.getString('test-key')).toBeUndefined();
        expect(deleteMMKV).not.toHaveBeenCalled();
    });

    it('clears unencrypted storage', () => {
        unecryptedJotaiStorage.set('test-key', 'test-value');

        clearStorage({ mmkvInstance: null });

        expect(unecryptedJotaiStorage.getString('test-key')).toBeUndefined();
    });
});
