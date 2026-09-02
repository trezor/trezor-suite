import type { Page } from '@playwright/test';
import { get, isEqual } from 'lodash';

type IndexedDbDumpKey = string | number | Array<string | number>;

type IndexedDbDumpEntry = {
    key: IndexedDbDumpKey;
    value: unknown;
};

export type IndexedDbDump = {
    version: number;
    stores: Record<string, IndexedDbDumpEntry[]>;
};

type GetIndexedDbValueParams = {
    dbName: string;
    storeName: string;
    key: string;
};

type IndexedDbValuePath = string | Array<string | number>;

type ExpectedIndexedDbValue =
    string | number | boolean | Record<string, unknown> | unknown[] | null;

type ExpectIndexedDbValueParams = GetIndexedDbValueParams & {
    valuePath?: IndexedDbValuePath;
    expectedValue: ExpectedIndexedDbValue;
    timeout?: number;
};

const stringifyForError = (value: unknown) => {
    if (typeof value === 'undefined') {
        return 'undefined';
    }

    return JSON.stringify(value, null, 2);
};

export class IndexedDbFixture {
    constructor(private readonly page: Page) {}

    async reset(): Promise<void> {
        await this.page.evaluate(
            () =>
                new Promise<void>((resolve, reject) => {
                    const request = indexedDB.deleteDatabase('trezor-suite');

                    request.onsuccess = () => {
                        resolve();
                    };

                    request.onerror = () => {
                        reject(request.error);
                    };
                }),
        );
    }

    async waitForInit(timeout = 30_000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const hasStores = await this.page.evaluate(
                () =>
                    new Promise<boolean>(resolve => {
                        const request = indexedDB.open('trezor-suite');

                        request.onsuccess = () => {
                            const db = request.result;
                            const ready = db.objectStoreNames.length > 0;
                            db.close();
                            resolve(ready);
                        };

                        request.onerror = () => resolve(false);
                    }),
            );

            if (hasStores) return;

            await new Promise(resolve => setTimeout(resolve, 200));
        }

        throw new Error('IndexedDB schema was not initialized within timeout');
    }

    // See `suite/e2e/docs/indexeddb-dumps.md` for how to produce a dump.
    async seedFromDump(dump: IndexedDbDump) {
        await this.page.evaluate(
            (dumpData: IndexedDbDump) =>
                new Promise<void>((resolve, reject) => {
                    const request = indexedDB.open('trezor-suite');

                    request.onsuccess = () => {
                        const db = request.result;
                        const storeNames = Array.from(db.objectStoreNames);
                        const tx = db.transaction(storeNames, 'readwrite');

                        tx.oncomplete = () => {
                            db.close();
                            resolve();
                        };

                        tx.onerror = () => {
                            db.close();
                            reject(tx.error);
                        };

                        storeNames.forEach(storeName => {
                            const store = tx.objectStore(storeName);
                            const entries = dumpData.stores[storeName] ?? [];
                            const hasKeyPath = store.keyPath !== null;

                            store.clear();
                            entries.forEach(entry => {
                                if (hasKeyPath) {
                                    store.put(entry.value);
                                } else {
                                    store.put(entry.value, entry.key);
                                }
                            });
                        });
                    };

                    request.onerror = () => reject(request.error);
                }),
            dump,
        );
        await this.page.reload();
    }

    getValue<T>({ dbName, storeName, key }: GetIndexedDbValueParams): Promise<T | undefined> {
        return this.page.evaluate(
            ({ dbName: databaseName, storeName: objectStoreName, key: objectStoreKey }) =>
                new Promise<T | undefined>((resolve, reject) => {
                    const openRequest = indexedDB.open(databaseName);

                    openRequest.onerror = () => reject(openRequest.error);
                    openRequest.onsuccess = () => {
                        try {
                            const db = openRequest.result;
                            const tx = db.transaction(objectStoreName, 'readonly');
                            const request = tx.objectStore(objectStoreName).get(objectStoreKey);

                            request.onerror = () => {
                                db.close();
                                reject(request.error);
                            };
                            request.onsuccess = () => {
                                db.close();
                                resolve(request.result);
                            };
                        } catch (error) {
                            openRequest.result.close();
                            reject(error);
                        }
                    };
                }),
            { dbName, storeName, key },
        );
    }

    async expectValue({
        dbName,
        storeName,
        key,
        valuePath,
        expectedValue,
        timeout = 5_000,
    }: ExpectIndexedDbValueParams): Promise<void> {
        const startTime = Date.now();
        const retryDelay = 500;
        let storeEntry: unknown;
        let actualValue: unknown;
        let latestError: unknown;

        while (Date.now() - startTime < timeout) {
            try {
                storeEntry = await this.getValue({ dbName, storeName, key });
                actualValue = valuePath !== undefined ? get(storeEntry, valuePath) : storeEntry;

                if (isEqual(actualValue, expectedValue)) {
                    return;
                }
            } catch (error) {
                latestError = error;
            }

            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        const dbPath = [dbName, storeName, key, valuePath].filter(Boolean).join('.');
        const latestErrorMessage =
            latestError instanceof Error ? latestError.message : stringifyForError(latestError);

        throw new Error(`IndexedDB value did not match expected value within ${timeout}ms.
Path: ${dbPath}
Expected: ${stringifyForError(expectedValue)}
Actual: ${stringifyForError(actualValue)}
Stored value: ${stringifyForError(storeEntry)}
${latestError ? `Last read error:\n${latestErrorMessage}` : ''}`);
    }
}
