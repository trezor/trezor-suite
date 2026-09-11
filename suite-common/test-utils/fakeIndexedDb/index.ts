// fake-indexeddb needs the structured-clone polyfill and the native setImmediate lock.
import '../globalOverrides';

import {
    IDBCursor,
    IDBCursorWithValue,
    IDBDatabase,
    IDBFactory,
    IDBIndex,
    IDBKeyRange,
    IDBObjectStore,
    IDBOpenDBRequest,
    IDBRecord,
    IDBRequest,
    IDBTransaction,
    IDBVersionChangeEvent,
} from 'fake-indexeddb';

// A fresh factory per call, so each test starts from an empty store instead of sharing one
// ambient instance.
export const installFakeIndexedDb = () => {
    const indexedDB = new IDBFactory();

    Object.assign(globalThis, {
        indexedDB,
        IDBCursor,
        IDBCursorWithValue,
        IDBDatabase,
        IDBFactory,
        IDBIndex,
        IDBKeyRange,
        IDBObjectStore,
        IDBOpenDBRequest,
        IDBRecord,
        IDBRequest,
        IDBTransaction,
        IDBVersionChangeEvent,
    });

    return indexedDB;
};
