import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';

import { type DbDeps, createDb } from '../src/storage/createDb';

export const createInMemoryDbMock = (deps: DbDeps) => {
    // IndexedDB is a browser global; each test gets a fresh in-memory backing store.
    installFakeIndexedDb();

    return createDb(deps);
};
