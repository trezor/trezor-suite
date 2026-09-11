import '@suite-common/test-utils/globalOverrides';

import { IDBFactory } from 'fake-indexeddb';

import { type DbDeps, createDb } from '../src/storage/createDb';

export const createInMemoryDbMock = (deps: DbDeps) => {
    // IndexedDB is a browser global; each test gets a fresh in-memory backing store.
    globalThis.indexedDB = new IDBFactory();

    return createDb(deps);
};
