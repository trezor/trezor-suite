import { createMockDeps } from '@trezor/dependency-injection';

import { createEmptyStoragePayload } from './createEmptyStoragePayload';
import { type StoragePayloadDb, loadStoragePayload } from './loadStoragePayload';

describe(createEmptyStoragePayload.name, () => {
    it('matches what loadStoragePayload reads from an empty database, key for key', async () => {
        const db = createMockDeps<StoragePayloadDb>({
            getItemByPK: () => Promise.resolve(undefined),
            getItemsExtended: () => Promise.resolve([]),
            getItemsWithKeys: () => Promise.resolve([]),
        });

        const loaded = await loadStoragePayload(db);
        const empty = createEmptyStoragePayload();

        expect(Object.keys(empty)).toEqual(Object.keys(loaded));
        expect(empty).toEqual(loaded);
    });
});
