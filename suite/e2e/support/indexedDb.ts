import type { Page } from '@playwright/test';

type IndexedDbDumpKey = string | number | Array<string | number>;

type IndexedDbDumpEntry = {
    key: IndexedDbDumpKey;
    value: unknown;
};

export type IndexedDbDump = {
    version: number;
    stores: Record<string, IndexedDbDumpEntry[]>;
};

export class IndexedDbFixture {
    constructor(private page: Page) {}

    async reset() {
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
}
