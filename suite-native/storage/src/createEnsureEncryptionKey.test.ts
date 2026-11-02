import { Alert } from 'react-native';

import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { createEnsureEncryptionKey } from './createEnsureEncryptionKey';
import { createMMKVStorage } from './mmkvStorage';

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));
jest.mock('expo-crypto', () => ({ getRandomBytes: jest.fn(() => new Uint8Array(16).fill(1)) }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

describe('createEnsureEncryptionKey', () => {
    it('shows the storage alert without replacing the key when both SecureStore reads fail', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Keychain unavailable'));
        jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
        const storage = createMMKVStorage({ ensureEncryptionKey: createEnsureEncryptionKey() });

        await expect(storage.getMMKV()).rejects.toThrow('Encryption key is unreadable!');

        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
        expect(getRandomBytes).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(alertSpy).toHaveBeenCalledWith(
            'Unable to load app data',
            expect.any(String),
            expect.any(Array),
        );
    });
});
