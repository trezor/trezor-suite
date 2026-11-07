import { Alert } from 'react-native';
import * as MMKV from 'react-native-mmkv';

import { captureException } from '@sentry/react-native';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { ENCRYPTION_KEY, createEnsureEncryptionKey } from './createEnsureEncryptionKey';
import { ENCRYPTED_STORAGE_ID } from './encryptedStorageId';
import { createMMKVStorage } from './mmkvStorage';
import { mockAppState } from '../mocks/mockAppState';

jest.mock('react-native-mmkv', () => {
    const actual = jest.requireActual<typeof MMKV>('react-native-mmkv');

    return { ...actual, existsMMKV: jest.fn() };
});
jest.mock('@sentry/react-native', () => ({ captureException: jest.fn() }));
jest.mock('expo-crypto', () => ({ getRandomBytes: jest.fn(() => new Uint8Array(16).fill(1)) }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));

const generatedKey = '01'.repeat(16);

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const getSentryPayload = () =>
    JSON.stringify(
        jest
            .mocked(captureException)
            .mock.calls.map(([exception, captureContext]) => [
                exception instanceof Error ? [exception.message, exception.stack] : exception,
                captureContext,
            ]),
    );

describe('createEnsureEncryptionKey', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAppState('active');
        jest.mocked(MMKV.existsMMKV).mockReturnValue(false);
        jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
    });

    it('generates and stores a key on the first start', async () => {
        jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
        jest.mocked(MMKV.existsMMKV).mockReturnValue(false);

        await expect(createEnsureEncryptionKey()()).resolves.toBe(generatedKey);

        expect(MMKV.existsMMKV).toHaveBeenCalledWith(ENCRYPTED_STORAGE_ID);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ENCRYPTION_KEY, generatedKey);
    });

    it('shows the storage alert without generating a key when encrypted storage exists without its key', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
        jest.mocked(MMKV.existsMMKV).mockReturnValue(true);
        const storage = createMMKVStorage({ ensureEncryptionKey: createEnsureEncryptionKey() });

        await expect(storage.getMMKV()).rejects.toThrow('Encryption key is unreadable!');

        expect(getRandomBytes).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(
            new Error('Encryption key is missing for existing encrypted storage'),
            { tags: { storageKeyFailure: 'read-null-with-existing-data', appState: 'active' } },
        );
    });

    it('does not generate a key when the retried read finds no key next to existing encrypted storage', async () => {
        jest.mocked(SecureStore.getItemAsync)
            .mockRejectedValueOnce(new Error('Keychain unavailable'))
            .mockResolvedValueOnce(null);
        jest.mocked(MMKV.existsMMKV).mockReturnValue(true);

        await expect(createEnsureEncryptionKey()()).resolves.toBeNull();

        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
        expect(getRandomBytes).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('generates a key when the retried read finds no key and no encrypted storage', async () => {
        jest.mocked(SecureStore.getItemAsync)
            .mockRejectedValueOnce(new Error('Keychain unavailable'))
            .mockResolvedValueOnce(null);
        jest.mocked(MMKV.existsMMKV).mockReturnValue(false);

        await expect(createEnsureEncryptionKey()()).resolves.toBe(generatedKey);

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ENCRYPTION_KEY, generatedKey);
    });

    it('generates the first key only after reading it again once the app becomes active', async () => {
        const { changeAppState, getListenerCount } = mockAppState('background');
        jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
        jest.mocked(MMKV.existsMMKV).mockReturnValue(false);

        const keyPromise = createEnsureEncryptionKey()();
        await flushPromises();

        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
        expect(getRandomBytes).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();

        changeAppState('active');

        await expect(keyPromise).resolves.toBe(generatedKey);
        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ENCRYPTION_KEY, generatedKey);
        expect(getListenerCount()).toBe(0);
    });

    it('does not generate a key when the read in foreground finds one that was missing in background', async () => {
        const storedKey = 'stored-encryption-key';
        const { changeAppState } = mockAppState('background');
        jest.mocked(SecureStore.getItemAsync)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(storedKey);

        const keyPromise = createEnsureEncryptionKey()();
        await flushPromises();
        changeAppState('active');

        await expect(keyPromise).resolves.toBe(storedKey);
        expect(getRandomBytes).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns null and reports when the new key cannot be stored', async () => {
        const writeError = new Error('Keychain write failed');
        jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
        jest.mocked(MMKV.existsMMKV).mockReturnValue(false);
        jest.mocked(SecureStore.setItemAsync).mockRejectedValue(writeError);

        await expect(createEnsureEncryptionKey()()).resolves.toBeNull();

        expect(captureException).toHaveBeenCalledTimes(1);
        expect(captureException).toHaveBeenCalledWith(writeError, {
            tags: { storageKeyFailure: 'set-failed', appState: 'active' },
        });
    });

    it('reports both failed reads so that Sentry Dedupe keeps the second one', async () => {
        mockAppState('background');
        const firstReadError = new Error('User interaction is not allowed.');
        const secondReadError = new Error('User interaction is not allowed.');
        jest.mocked(SecureStore.getItemAsync)
            .mockRejectedValueOnce(firstReadError)
            .mockRejectedValueOnce(secondReadError);

        await expect(createEnsureEncryptionKey()()).resolves.toBeNull();

        expect(jest.mocked(captureException).mock.calls).toEqual([
            [
                firstReadError,
                { tags: { storageKeyFailure: 'read-threw', appState: 'background', attempt: 1 } },
            ],
            [
                secondReadError,
                {
                    tags: { storageKeyFailure: 'read-threw', appState: 'background', attempt: 2 },
                    fingerprint: ['{{ default }}'],
                },
            ],
        ]);
    });

    it('never sends the encryption key to Sentry', async () => {
        const storedKey = 'stored-encryption-key';
        jest.mocked(MMKV.existsMMKV).mockReturnValue(false);
        jest.mocked(SecureStore.getItemAsync)
            .mockRejectedValueOnce(new Error('Keychain unavailable'))
            .mockResolvedValueOnce(null)
            .mockRejectedValueOnce(new Error('Keychain unavailable'))
            .mockResolvedValueOnce(storedKey);
        jest.mocked(SecureStore.setItemAsync).mockRejectedValue(new Error('Keychain write failed'));
        const ensureEncryptionKey = createEnsureEncryptionKey();

        await expect(ensureEncryptionKey()).resolves.toBeNull();
        await expect(ensureEncryptionKey()).resolves.toBe(storedKey);

        expect(captureException).toHaveBeenCalledTimes(3);
        expect(getSentryPayload()).not.toContain(generatedKey);
        expect(getSentryPayload()).not.toContain(storedKey);
    });

    it('reads the key again after it was unavailable', async () => {
        const storedKey = 'stored-encryption-key';
        jest.mocked(SecureStore.getItemAsync)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(storedKey);
        jest.mocked(MMKV.existsMMKV).mockReturnValue(true);
        const ensureEncryptionKey = createEnsureEncryptionKey();

        await expect(ensureEncryptionKey()).resolves.toBeNull();
        await expect(ensureEncryptionKey()).resolves.toBe(storedKey);

        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
    });

    it('shares a pending read and caches the key', async () => {
        const storedKey = 'stored-encryption-key';
        jest.mocked(SecureStore.getItemAsync).mockResolvedValue(storedKey);
        const ensureEncryptionKey = createEnsureEncryptionKey();

        const keys = await Promise.all([ensureEncryptionKey(), ensureEncryptionKey()]);

        expect(keys).toEqual([storedKey, storedKey]);
        await expect(ensureEncryptionKey()).resolves.toBe(storedKey);
        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
    });

    it('shows the storage alert without replacing the key when both SecureStore reads fail', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error('Keychain unavailable'));
        const storage = createMMKVStorage({ ensureEncryptionKey: createEnsureEncryptionKey() });

        await expect(storage.getMMKV()).rejects.toThrow('Encryption key is unreadable!');

        expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
        expect(MMKV.existsMMKV).not.toHaveBeenCalled();
        expect(getRandomBytes).not.toHaveBeenCalled();
        expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledTimes(1);
        expect(alertSpy).toHaveBeenCalledWith(
            'Unable to load app data',
            expect.any(String),
            expect.any(Array),
            { cancelable: false },
        );
    });
});
