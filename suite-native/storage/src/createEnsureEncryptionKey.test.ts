import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { createMockDeps } from '@trezor/dependency-injection';

import { createEnsureEncryptionKey } from './createEnsureEncryptionKey';
import { type MMKVStorageDeps, createMMKVStorage } from './mmkvStorage';

jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));
jest.mock('expo-crypto', () => ({ getRandomBytes: jest.fn(() => new Uint8Array(16).fill(1)) }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

describe('createEnsureEncryptionKey', () => {
    it('shows the storage alert without replacing the key when both SecureStore reads fail', async () => {
        jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Keychain unavailable'));
        jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
        const deps = createMockDeps<MMKVStorageDeps>({
            ensureEncryptionKey: createEnsureEncryptionKey(),
            createMMKV: null,
            alertStorageLoadFailure: () => {},
        });
        const storage = createMMKVStorage(deps);

        await expect(storage.getMMKV()).rejects.toThrow('Encryption key is unreadable!');

        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
        expect(getRandomBytes).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
        expect(deps.alertStorageLoadFailure).toHaveBeenCalledTimes(1);
        expect(deps.alertStorageLoadFailure).toHaveBeenCalledWith({ mmkvInstance: null });
    });
});
