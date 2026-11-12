import { createMockDeps } from '@trezor/dependency-injection';

import {
    type StorageCredentialIdStorageDeps,
    createStorageCredentialIdStorage,
} from './credentialIdStorage';

describe(createStorageCredentialIdStorage.name, () => {
    it('keeps the credential id in the given storage', () => {
        const items = new Map<string, string>();
        const deps = createMockDeps<StorageCredentialIdStorageDeps>({
            storage: {
                getItem: key => items.get(key) ?? null,
                setItem: (key, value) => {
                    items.set(key, value);
                },
            },
        });
        const credentialIdStorage = createStorageCredentialIdStorage(deps);

        expect(credentialIdStorage.getCredentialId()).toBeNull();
        credentialIdStorage.setCredentialId('abcd');

        expect(credentialIdStorage.getCredentialId()).toBe('abcd');
        expect(deps.storage.setItem).toHaveBeenCalledWith(expect.any(String), 'abcd');
    });
});
