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

/**
 * Exists on this origin from the first write of an import until its last database is in place.
 * Found on a later start, it tells that the import stopped half-way,
 * so the databases of the export that are here are its leftovers and not the user's.
 * It is a database because the databases of an origin share one log on the disk:
 * the marker is there whenever a database written after it is,
 * which a localStorage entry, flushed with a delay, would not guarantee.
 */
const IMPORT_MARKER_DATABASE = 'legacy-origin-storage-import';

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : String(error);

const createImportMarker = () =>
    new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(IMPORT_MARKER_DATABASE);

        request.onsuccess = () => {
            request.result.close();
            resolve();
        };
        request.onerror = () =>
            reject(request.error ?? new Error('Cannot mark the import as started'));
    });

const deleteDatabase = (name: string) =>
    new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);

        request.onsuccess = () => resolve();
        request.onerror = () =>
            reject(request.error ?? new Error(`Cannot delete the database ${name}`));
        request.onblocked = () => reject(new Error(`The database ${name} is blocked`));
    });

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
 * anything reads the origin's storage. An import that stopped half-way is done again from the
 * start; otherwise an import is refused when a database it carries already exists here.
 */
export const importLegacyOriginStorage = async (
    storage: LegacyOriginStorage,
): Promise<Result<LegacyOriginStorageImport, string>> => {
    try {
        const existingDatabases = await indexedDB.databases();
        const existingNames = new Set(existingDatabases.map(database => database.name));
        const databasesAlreadyHere = storage.databases.filter(database =>
            existingNames.has(database.name),
        );

        if (existingNames.has(IMPORT_MARKER_DATABASE)) {
            for (const database of databasesAlreadyHere) {
                await deleteDatabase(database.name);
            }
        } else if (databasesAlreadyHere.length > 0) {
            return ok({ isImported: false });
        } else {
            await createImportMarker();
        }

        Object.entries(storage.localStorage).forEach(([key, value]) =>
            localStorage.setItem(key, value),
        );
        await importFiles(storage.files);

        // Last and one by one: the databases are the bulk and the part that can be interrupted.
        for (const database of storage.databases) {
            await importDatabase(database);
        }
        await deleteDatabase(IMPORT_MARKER_DATABASE);

        return ok({ isImported: true });
    } catch (error) {
        return err(getErrorMessage(error));
    }
};
