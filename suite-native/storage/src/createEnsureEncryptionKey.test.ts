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
