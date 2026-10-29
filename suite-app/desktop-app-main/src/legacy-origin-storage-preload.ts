/**
 * Preload of the hidden export page, which the main process loads from `file://`, the origin
 * Suite's renderer had before it moved to the renderer scheme (see libs/renderer-protocol.ts).
 * Browser storage is keyed by origin and cannot be moved, so this reads the origin's IndexedDB,
 * localStorage and origin private file system and streams them to modules/legacy-origin-storage.ts.
 * The page itself runs no script.
 */
import { ipcRenderer } from 'electron';

import {
    type LegacyOriginDatabaseDefinition,
    type LegacyOriginExportFailedMessage,
    type LegacyOriginExportFinishedMessage,
    type LegacyOriginExportObjectStoreMessage,
    type LegacyOriginFile,
    type LegacyOriginObjectStoreDefinition,
} from '@suite/desktop-app-api';

import { LEGACY_ORIGIN_EXPORT_CHANNELS } from './libs/legacy-origin-storage-export';

const RECORDS_PER_MESSAGE = 2000;
const EXPORT_PAGE_NAME = 'legacy-origin-storage.html';

const toPromise = <T>(request: IDBRequest<T>) =>
    new Promise<T>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    });

const openDatabase = (name: string) =>
    new Promise<IDBDatabase>((resolve, reject) => {
        // Without a version the database opens as it is, so no upgrade can run here.
        const request = indexedDB.open(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(request.error ?? new Error(`Cannot open the database ${name}`));
        request.onblocked = () => reject(new Error(`The database ${name} is blocked`));
    });

const describeObjectStore = (store: IDBObjectStore): LegacyOriginObjectStoreDefinition => ({
    name: store.name,
    keyPath: store.keyPath,
    autoIncrement: store.autoIncrement,
    indexes: Array.from(store.indexNames).map(indexName => {
        const index = store.index(indexName);

        return {
            name: index.name,
            keyPath: index.keyPath,
            unique: index.unique,
            multiEntry: index.multiEntry,
        };
    }),
});

const exportObjectStore = async (
    db: IDBDatabase,
    database: LegacyOriginDatabaseDefinition,
    storeName: string,
) => {
    let afterLastKey: IDBKeyRange | undefined;

    for (;;) {
        // Each slice gets its own transaction: a transaction commits on its own while the IPC
        // round trip is awaited, and the page is the origin's only user, so the slices add up.
        const store = db.transaction(storeName, 'readonly').objectStore(storeName);
        const [keys, values] = await Promise.all([
            toPromise(store.getAllKeys(afterLastKey, RECORDS_PER_MESSAGE)),
            toPromise(store.getAll(afterLastKey, RECORDS_PER_MESSAGE)),
        ]);
        const message: LegacyOriginExportObjectStoreMessage = {
            database,
            objectStore: describeObjectStore(store),
            records: keys.map((key, index) => ({ key, value: values[index] })),
        };
        await ipcRenderer.invoke(LEGACY_ORIGIN_EXPORT_CHANNELS.objectStore, message);

        const lastKey = keys[keys.length - 1];
        if (keys.length < RECORDS_PER_MESSAGE || lastKey === undefined) return;
        afterLastKey = IDBKeyRange.lowerBound(lastKey, true);
    }
};

const exportFiles = async (directory: FileSystemDirectoryHandle, parentPath: string[]) => {
    for await (const [name, handle] of directory.entries()) {
        const filePath = [...parentPath, name];

        if (handle instanceof FileSystemDirectoryHandle) {
            await exportFiles(handle, filePath);
        } else if (handle instanceof FileSystemFileHandle) {
            const file = await handle.getFile();
            const message: LegacyOriginFile = { path: filePath, content: await file.arrayBuffer() };
            await ipcRenderer.invoke(LEGACY_ORIGIN_EXPORT_CHANNELS.file, message);
        }
    }
};

const getRootDirectory = async () => {
    try {
        return await navigator.storage.getDirectory();
    } catch {
        // The origin private file system is not available on this origin, so nothing lives there.
        return undefined;
    }
};

const exportStorage = async () => {
    const databases: LegacyOriginExportFinishedMessage['databases'] = [];

    for (const { name } of await indexedDB.databases()) {
        if (!name) continue;

        const db = await openDatabase(name);
        try {
            const database: LegacyOriginDatabaseDefinition = { name, version: db.version };
            const objectStoreNames = Array.from(db.objectStoreNames);
            for (const storeName of objectStoreNames) {
                await exportObjectStore(db, database, storeName);
            }
            databases.push({ ...database, objectStoreNames });
        } finally {
            db.close();
        }
    }

    const localStorageEntries = Object.fromEntries(
        Object.keys(localStorage).map(key => [key, localStorage.getItem(key) ?? '']),
    );

    const rootDirectory = await getRootDirectory();
    if (rootDirectory) {
        await exportFiles(rootDirectory, []);
    }

    const message: LegacyOriginExportFinishedMessage = {
        databases,
        localStorage: localStorageEntries,
    };
    await ipcRenderer.invoke(LEGACY_ORIGIN_EXPORT_CHANNELS.finished, message);
};

// The preload also runs in the window's initial blank document, whose opaque origin has no
// storage; only the export page itself holds the legacy origin's data.
const isExportPage =
    location.protocol === 'file:' && location.pathname.endsWith(`/${EXPORT_PAGE_NAME}`);

if (isExportPage) {
    exportStorage().catch((error: unknown) => {
        const message: LegacyOriginExportFailedMessage = {
            error: error instanceof Error ? error.message : String(error),
        };

        return ipcRenderer.invoke(LEGACY_ORIGIN_EXPORT_CHANNELS.failed, message);
    });
}
