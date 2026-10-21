import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { createEnsureEncryptionKey } from './createEnsureEncryptionKey';

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));
jest.mock('expo-crypto', () => ({ getRandomBytes: jest.fn(() => new Uint8Array(16).fill(1)) }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

describe('createEnsureEncryptionKey', () => {
    it('does not replace the key when both SecureStore reads fail', async () => {
        jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Keychain unavailable'));
        jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);

        await expect(createEnsureEncryptionKey()()).resolves.toBeNull();

        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
        expect(getRandomBytes).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });
});
