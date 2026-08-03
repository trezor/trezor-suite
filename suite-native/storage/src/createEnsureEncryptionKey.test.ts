import * as SecureStore from 'expo-secure-store';

import { ENCRYPTION_KEY, createEnsureEncryptionKey } from './createEnsureEncryptionKey';

// Sentinel that stands in for the real `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` accessibility constant,
// so we can assert the production code passes exactly that (device-bound, non-backup) value.
const THIS_DEVICE_ONLY_SENTINEL = 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY_SENTINEL';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    // Only the accessibility level we expect must be present; any other value would make the
    // assertions below compare against `undefined` and fail.
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY_SENTINEL',
}));

jest.mock('expo-crypto', () => ({
    // 16 deterministic bytes → predictable hex key.
    getRandomBytes: jest.fn(() => new Uint8Array(16).fill(0xab)),
}));

jest.mock('@sentry/react-native', () => ({
    captureException: jest.fn(),
}));

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('createEnsureEncryptionKey', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('generates a new key with device-bound (non-backup) keychain accessibility', async () => {
        // No key stored yet → first launch path that writes a freshly generated key.
        mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);
        mockedSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

        const key = await createEnsureEncryptionKey()();

        expect(key).toBe(Buffer.from(new Uint8Array(16).fill(0xab)).toString('hex'));

        // The security-critical assertion: the key that decrypts the confidential MMKV store must
        // never be persisted with the default `WHEN_UNLOCKED` accessibility (which is included in
        // device backups and migrates to a new device on restore).
        expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
            ENCRYPTION_KEY,
            key,
            expect.objectContaining({ keychainAccessible: THIS_DEVICE_ONLY_SENTINEL }),
        );
    });

    it('reads an existing key with device-bound keychain accessibility', async () => {
        mockedSecureStore.getItemAsync.mockResolvedValueOnce('deadbeef');

        const key = await createEnsureEncryptionKey()();

        expect(key).toBe('deadbeef');
        expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith(
            ENCRYPTION_KEY,
            expect.objectContaining({ keychainAccessible: THIS_DEVICE_ONLY_SENTINEL }),
        );
        // Existing key must not be re-written.
        expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
    });
});
