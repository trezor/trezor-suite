import {
    type LegacyOriginDatabase,
    type LegacyOriginFile,
    type LegacyOriginStorage,
} from '@suite/desktop-app-api';
import { type Result, err, ok } from '@trezor/type-utils';

export type LegacyOriginStorageImport = {
    /** False when this origin already had one of the databases, so nothing was written. */
    isImported: boolean;
};

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

/**
 * Recreates a database exactly as it was on the legacy origin: the same version, stores, indexes
 * and records. Everything is written in the creation's own versionchange transaction, so an
 * interrupted import leaves no database behind, and the app's regular open then upgrades the
 * database through the same migrations it would have run on the legacy origin.
 */
const importDatabase = ({ name, version, objectStores }: LegacyOriginDatabase) =>
    new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, version);

        request.onupgradeneeded = () => {
            const db = request.result;
            const { transaction } = request;

            try {
                objectStores.forEach(objectStore => {
                    const store = db.createObjectStore(objectStore.name, {
                        keyPath: objectStore.keyPath ?? undefined,
                        autoIncrement: objectStore.autoIncrement,
                    });
                    objectStore.indexes.forEach(index =>
                        store.createIndex(index.name, index.keyPath, {
                            unique: index.unique,
                            multiEntry: index.multiEntry,
                        }),
                    );
                    objectStore.records.forEach(({ key, value }) => {
                        if (objectStore.keyPath === null) {
                            store.put(value, key as IDBValidKey);
                        } else {
                            store.put(value);
                        }
                    });
                });
            } catch (error) {
                // Aborting a newly created database's upgrade deletes the database again.
                transaction?.abort();
                reject(error);
            }
        };
        request.onsuccess = () => {
            request.result.close();
            resolve();
        };
        request.onerror = () =>
            reject(request.error ?? new Error(`Cannot create the database ${name}`));
        request.onblocked = () => reject(new Error(`The database ${name} is blocked`));
    });

const importFiles = async (files: LegacyOriginFile[]) => {
    // Absent outside Chromium, which is also where no sync database can be waiting.
    const storageManager: StorageManager | undefined = navigator.storage;
    if (files.length === 0 || !storageManager) return;

    const rootDirectory = await storageManager.getDirectory();

    for (const { path, content } of files) {
        const fileName = path[path.length - 1];
        if (fileName === undefined) continue;

        let directory = rootDirectory;
        for (const segment of path.slice(0, -1)) {
            directory = await directory.getDirectoryHandle(segment, { create: true });
        }

        const fileHandle = await directory.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }
};

/**
 * Writes the storage exported from the renderer's legacy origin into this origin. Must run before
 * anything reads the origin's storage. Writing the same storage twice is harmless; an import is
 * refused only when a database it carries already exists here.
 */
export const importLegacyOriginStorage = async (
    storage: LegacyOriginStorage,
): Promise<Result<LegacyOriginStorageImport, string>> => {
    try {
        const existingDatabases = await indexedDB.databases();
        const existingNames = new Set(existingDatabases.map(database => database.name));
        if (storage.databases.some(database => existingNames.has(database.name))) {
            return ok({ isImported: false });
        }

        Object.entries(storage.localStorage).forEach(([key, value]) =>
            localStorage.setItem(key, value),
        );
        await importFiles(storage.files);

        // Last and one by one: the databases are the bulk and the part that can be interrupted.
        for (const database of storage.databases) {
            await importDatabase(database);
        }

        return ok({ isImported: true });
    } catch (error) {
        return err(getErrorMessage(error));
    }
};
