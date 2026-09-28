import { createMockDeps } from '@suite-common/dependency-injection';

import { type StorageEncryptionKey } from './createEnsureEncryptionKey';
import { ENCRYPTED_STORAGE_ID, type MMKVStorageDeps, createMMKVStorage } from './mmkvStorage';
import { mockMMKV } from '../mocks/mockMMKV';

const encryptionKey = 'test-encryption-key' as StorageEncryptionKey;
const encryptionKeyPromise = Promise.resolve(encryptionKey);

describe('createMMKVStorage', () => {
    it('shares one MMKV instance across concurrent initialization and subsequent operations', async () => {
        const deps = createMockDeps<MMKVStorageDeps>({
            ensureEncryptionKey: () => encryptionKeyPromise,
            createMMKV: () => mockMMKV(),
            alertStorageLoadFailure: null,
        });
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
        expect(deps.createMMKV).toHaveBeenCalledTimes(1);
        expect(deps.createMMKV).toHaveBeenCalledWith({ id: ENCRYPTED_STORAGE_ID, encryptionKey });
        expect(await storage.getMMKV()).toBe(firstInstance);
        expect(await storage.getItem('test-key')).toBe('test-value');

        await storage.removeItem('test-key');

        expect(await storage.getItem('test-key')).toBeUndefined();
        expect(deps.createMMKV).toHaveBeenCalledTimes(1);
    });

    it('allows initialization to be retried after MMKV creation fails', async () => {
        const error = new Error('Unable to open storage');
        const deps = createMockDeps<MMKVStorageDeps>({
            ensureEncryptionKey: () => encryptionKeyPromise,
            createMMKV: () => mockMMKV(),
            alertStorageLoadFailure: () => {},
        });
        deps.createMMKV.mockImplementationOnce(() => {
            throw error;
        });
        const storage = createMMKVStorage(deps);

        await expect(storage.getMMKV()).rejects.toThrow(error);
        expect(deps.alertStorageLoadFailure).toHaveBeenCalledTimes(1);

        const instance = await storage.getMMKV();

        expect(await storage.getMMKV()).toBe(instance);
        expect(deps.createMMKV).toHaveBeenCalledTimes(2);
    });

    it('does not create MMKV when the encryption key is unreadable', async () => {
        const deps = createMockDeps<MMKVStorageDeps>({
            ensureEncryptionKey: () => Promise.resolve(null),
            createMMKV: null,
            alertStorageLoadFailure: () => {},
        });
        const storage = createMMKVStorage(deps);

        await expect(storage.getMMKV()).rejects.toThrow('Encryption key is unreadable!');

        expect(deps.createMMKV).not.toHaveBeenCalled();
        expect(deps.alertStorageLoadFailure).toHaveBeenCalledTimes(1);
    });
});
