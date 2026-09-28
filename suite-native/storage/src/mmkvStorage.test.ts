import { Alert } from 'react-native';
import * as MMKV from 'react-native-mmkv';

import {
    type EnsureEncryptionKeyDep,
    type StorageEncryptionKey,
} from './createEnsureEncryptionKey';
import { ENCRYPTED_STORAGE_ID, createMMKVStorage } from './mmkvStorage';

jest.mock('react-native-mmkv', () => {
    const actual = jest.requireActual<typeof MMKV>('react-native-mmkv');

    return { ...actual, createMMKV: jest.fn(actual.createMMKV) };
});

const encryptionKey = 'test-encryption-key' as StorageEncryptionKey;
const encryptionKeyPromise = Promise.resolve(encryptionKey);
const deps: EnsureEncryptionKeyDep = {
    ensureEncryptionKey: () => encryptionKeyPromise,
};

describe('createMMKVStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('shares one MMKV instance across concurrent initialization and subsequent operations', async () => {
        const storage = createMMKVStorage(deps);

        const [firstInstance, secondInstance] = await Promise.all([
            storage.getMMKV(),
            storage.getMMKV(),
            ...Array.from({ length: 24 }, (_, index) =>
                storage.getItem(`persist:reducer-${index}`),
            ),
            storage.setItem('test-key', 'test-value'),
            storage.removeItem('missing-key'),
        ]);

        expect(firstInstance).toBe(secondInstance);
        expect(MMKV.createMMKV).toHaveBeenCalledTimes(1);
        expect(MMKV.createMMKV).toHaveBeenCalledWith({ id: ENCRYPTED_STORAGE_ID, encryptionKey });
        expect(await storage.getMMKV()).toBe(firstInstance);
        expect(await storage.getItem('test-key')).toBe('test-value');

        await storage.removeItem('test-key');

        expect(await storage.getItem('test-key')).toBeUndefined();
        expect(MMKV.createMMKV).toHaveBeenCalledTimes(1);
    });

    it('allows initialization to be retried after MMKV creation fails', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const error = new Error('Unable to open storage');
        jest.mocked(MMKV.createMMKV).mockImplementationOnce(() => {
            throw error;
        });
        const storage = createMMKVStorage(deps);

        await expect(storage.getMMKV()).rejects.toThrow(error);
        expect(alertSpy).toHaveBeenCalledTimes(1);

        const instance = await storage.getMMKV();

        expect(await storage.getMMKV()).toBe(instance);
        expect(MMKV.createMMKV).toHaveBeenCalledTimes(2);
    });

    it('does not create MMKV when the encryption key is unreadable', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const unreadableKeyDeps: EnsureEncryptionKeyDep = {
            ensureEncryptionKey: () => Promise.resolve(null),
        };
        const storage = createMMKVStorage(unreadableKeyDeps);

        await expect(storage.getMMKV()).rejects.toThrow('Encryption key is unreadable!');

        expect(MMKV.createMMKV).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledTimes(1);
    });
});
