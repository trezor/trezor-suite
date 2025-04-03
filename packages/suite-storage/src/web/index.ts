import {
    IDBPDatabase,
    IDBPTransaction,
    IndexKey,
    IndexNames,
    StoreKey,
    StoreNames,
    StoreValue,
    deleteDB,
    openDB,
    unwrap,
} from 'idb';

import { createLazy } from '@trezor/utils';

export type OnUpgradeFunc<TDBStructure> = (
    db: IDBPDatabase<TDBStructure>,
    oldVersion: number,
    newVersion: number | null,
    transaction: IDBPTransaction<TDBStructure, StoreNames<TDBStructure>[], 'versionchange'>,
) => Promise<void>;

class CommonDB<TDBStructure> {
    private static instance: CommonDB<any>;
    dbName!: string;
    version!: number;
    supported: boolean | undefined;
    blocking = false;
    blocked = false;
    onUpgrade!: OnUpgradeFunc<TDBStructure>;
    onDowngrade!: () => any;
    onBlocked?: () => void;
    onBlocking?: () => void;

    /**
     * when db is opened for the first time, postpone all other calls to getDB until the first call is resolved.
     * this ensures that migration/db setup is completed
     */
    private lazyDb = createLazy(this.initDb.bind(this), db => db.close());

    constructor(
        dbName: string,
        version: number,
        onUpgrade: OnUpgradeFunc<TDBStructure>,
        onDowngrade: () => any,
        onBlocked?: () => void,
        onBlocking?: () => void,
    ) {
        if (CommonDB.instance) {
            return CommonDB.instance;
        }

        this.dbName = dbName;
        this.version = version;
        this.supported = undefined;
        this.onUpgrade = onUpgrade.bind(this);
        this.onDowngrade = onDowngrade.bind(this);
        this.onBlocked = onBlocked;
        this.onBlocking = onBlocking;
        this.blocking = false;
        this.blocked = false;

        this.isSupported();

        CommonDB.instance = this;
    }

    static isDBAvailable = () => !!indexedDB || !!window.indexedDB || !!global.indexedDB;

    isSupported = () => {
        if (this.supported === undefined) {
            const isAvailable = CommonDB.isDBAvailable();
            this.supported = isAvailable;
            if (!isAvailable) {
                console.warn("Couldn't get an access to IndexedDB.");
            }
        }

        return this.supported;
    };

    isAccessible = (): Promise<boolean> => {
        const isSupported = this.isSupported();

        // if the instance is blocking db upgrade, db connection will be closed
        return Promise.resolve(isSupported && !this.blocking && !this.blocked);
    };

    closeAfterTimeout = (timeout = 1000) => {
        setTimeout(() => {
            this.lazyDb.dispose();
        }, timeout);
    };

    private initDb() {
        return openDB<TDBStructure>(this.dbName, this.version, {
            upgrade: (db, oldVersion, newVersion, transaction) => {
                // Called if this version of the database has never been opened before. Use it to specify the schema for the database.
                this.onUpgrade(db, oldVersion, newVersion, transaction);
            },
            blocked: () => {
                this.blocked = true;
                // Called if there are older versions of the database open on the origin, so this version cannot open.
                if (this.onBlocked) {
                    this.onBlocked();
                }
                // wait 1 sec before closing the db to let app enough time to finish all requests
                this.closeAfterTimeout();
            },
            blocking: () => {
                // Called if this connection is blocking a future version of the database from opening.
                this.blocking = true;
                if (this.onBlocking) {
                    this.onBlocking();
                }
                // wait 1 sec before closing the db to let app enough time to finish all requests
                this.closeAfterTimeout();
            },
            terminated: () => {
                // browser killed idb / user cleared history so let's open DB again on next operation
                this.lazyDb.dispose();
                console.warn('Unexpected IDB close');
            },
        }).catch(error => {
            if (error?.name === 'VersionError') {
                indexedDB.deleteDatabase(this.dbName);
                console.warn(
                    'IndexedDB was deleted because your version is higher than it should be (downgrade)',
                );
                this.onDowngrade();
            }
            throw error;
        });
    }

    getDB = this.lazyDb.getOrInit;

    addItem = async <
        TStoreName extends StoreNames<TDBStructure>,
        TItem extends StoreValue<TDBStructure, TStoreName>,
        TKey extends StoreKey<TDBStructure, TStoreName>,
    >(
        store: TStoreName,
        item: TItem,
        key?: TKey,
        upsert?: boolean,
    ): Promise<StoreKey<TDBStructure, TStoreName>> => {
        // TODO: When using idb wrapper something throws 'Uncaught (in promise) null'
        // and I couldn't figure out how to catch it. Maybe a bug in idb?
        // So instead of using idb wrapper I use indexedDB directly, wrapped in my own promise.
        const db: IDBDatabase = unwrap(await this.getDB());

        const storeName = store as string;

        const p = new Promise<StoreKey<TDBStructure, TStoreName>>((resolve, reject) => {
            try {
                const tx = db.transaction(storeName, 'readwrite');
                const params: Parameters<IDBObjectStore['put']> = key
                    ? [item, key]
                    : [item, undefined];
                const req: IDBRequest = upsert
                    ? tx.objectStore(storeName).put(...params)
                    : tx.objectStore(storeName).add(...params);
                req.onerror = _event => {
                    reject(req.error);
                };
                req.onsuccess = _event => {
                    resolve(req.result);
                };
            } catch (error) {
                console.error(error);
            }
        });

        return p;
    };

    addItems = async <
        TStoreName extends StoreNames<TDBStructure>,
        TItem extends StoreValue<TDBStructure, TStoreName>,
    >(
        store: TStoreName,
        items: TItem[],
        upsert?: boolean,
    ) => {
        const db = await this.getDB();
        // jest won't resolve tx.done when 'items' is empty array
        if (items.length === 0) return Promise.resolve();
        const tx = db.transaction(store, 'readwrite');

        const keys: StoreKey<TDBStructure, StoreNames<TDBStructure>>[] = [];
        const promisesOfItems: Promise<void[]> = Promise.all(
            items
                .map(item => {
                    if (upsert) {
                        return tx.store.put(item).then(result => {
                            keys.push(result);
                        });
                    }

                    return tx.store.add(item).then(result => {
                        keys.push(result);
                    });
                })
                .concat(tx.done),
        );
        const aggregatedPromise: Promise<void> = promisesOfItems.then(() => {});

        return aggregatedPromise;
    };

    getItemByPK = async <
        TStoreName extends StoreNames<TDBStructure>,
        TKey extends StoreKey<TDBStructure, TStoreName>,
    >(
        store: TStoreName,
        primaryKey: TKey,
    ): Promise<StoreValue<TDBStructure, TStoreName> | undefined> => {
        const db = await this.getDB();
        const tx = db.transaction(store);
        const item = await tx.store.get(primaryKey);

        return item;
    };

    getItemByIndex = async <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>,
    >(
        store: TStoreName,
        indexName: TIndexName,
        key: TKey,
    ) => {
        // returns the tx with txID
        const db = await this.getDB();
        const tx = db.transaction(store);
        const index = tx.store.index(indexName);
        const item = await index.get(IDBKeyRange.only(key));

        return item;
    };

    updateItemByIndex = async <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>,
    >(
        store: TStoreName,
        indexName: TIndexName,
        key: TKey,
        updateObject: { [key: string]: any },
    ) => {
        const db = await this.getDB();
        const tx = db.transaction(store, 'readwrite');
        const index = tx.store.index(indexName);
        const result = await index.get(key);
        if (result) {
            Object.assign(result, updateObject);

            return tx.store.put(result);
        }
    };

    removeItemByPK = async <
        TStoreName extends StoreNames<TDBStructure>,
        TKey extends StoreKey<TDBStructure, TStoreName>,
    >(
        store: TStoreName,
        key: TKey,
    ) => {
        const db = await this.getDB();
        const tx = db.transaction(store, 'readwrite');
        const res = await tx.store.delete(key);

        return res;
        // TODO: needs to differentiate between PKs, Index keys...
        // if (res) {
        //     this.notify(store, [key]);
        // }
    };

    removeItemByIndex = async <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>,
    >(
        store: TStoreName,
        indexName: TIndexName,
        key: TKey,
    ) => {
        const db = await this.getDB();
        const tx = db.transaction(store, 'readwrite');
        const txIdIndex = tx.store.index(indexName);
        let cursor = await txIdIndex.openCursor(IDBKeyRange.only(key));
        while (cursor) {
            cursor.delete();

            cursor = await cursor.continue();
        }
    };

    getItemsExtended = async <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
    >(
        store: TStoreName,
        indexName?: TIndexName,
        filters?: { key?: any; offset?: number; count?: number; reverse?: boolean },
    ) => {
        const db = await this.getDB();
        const tx = db.transaction(store);
        if (indexName) {
            const index = tx.store.index(indexName);
            if (filters && filters.key !== undefined) {
                if (filters.offset !== undefined || filters.count !== undefined) {
                    // cursor with keyrange for given accountId (covers all timestamps)
                    let cursor = await index.openCursor(
                        IDBKeyRange.bound([filters.key], [filters.key, '']),
                    );
                    const items = [];
                    let counter = 0;
                    if (cursor) {
                        // move cursor in position
                        if (filters.offset) cursor = await cursor.advance(filters.offset);
                        while (cursor && (!filters.count || counter < filters.count)) {
                            // iterate unless cursor returns null or we have enough items (count param)
                            items.push(cursor.value);

                            cursor = await cursor.continue();
                            counter++;
                        }
                    }

                    return items;
                }
                // if offset and count params are undefined just use getAll on index instead of cursor.
                // all txs for given accountId
                // bound([accountId, undefined], [accountId, '']) should cover all timestamps
                const keyRange = IDBKeyRange.bound([filters.key], [filters.key, '']);

                return index.getAll(keyRange);
            }

            if (filters && filters.reverse) {
                // get items in reverse order
                let cursor = await index.openCursor(undefined, 'prev');
                const items = [];
                while (cursor) {
                    items.push(cursor.value);

                    cursor = await cursor.continue();
                }

                return items;
            }

            return index.getAll();
        }

        // no accountId, return all txs
        return tx.store.getAll();
    };

    getItemsWithKeys = async <TStoreName extends StoreNames<TDBStructure>>(store: TStoreName) => {
        const db = await this.getDB();
        let cursor = await db.transaction(store).store.openCursor();
        const resp = [];
        while (cursor) {
            resp.push({
                key: cursor.key,
                value: cursor.value,
            });

            cursor = await cursor.continue();
        }

        return resp;
    };

    clearStores = async <TStoreName extends StoreNames<TDBStructure>>(
        storeNames?: TStoreName[],
    ) => {
        const db = await this.getDB();

        const extractStoreNames = () => {
            const names: StoreNames<TDBStructure>[] = [];
            const list = db.objectStoreNames;
            const { length } = list;
            for (let i = 0; i < length; i++) {
                const storeName = list.item(i);
                if (storeName) {
                    names.push(storeName);
                }
            }

            return names;
        };

        const list = storeNames ?? extractStoreNames();
        const promises = list.map(storeName => {
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);

            return objectStore.clear();
        });
        await Promise.all(promises);
    };

    removeDatabase = () => {
        this.lazyDb.dispose();

        return deleteDB(this.dbName);
    };

    static removeStores = <TDBStructure>(db: IDBPDatabase<TDBStructure>) => {
        const list = db.objectStoreNames;
        const { length } = list;
        for (let i = 0; i < length; i++) {
            const storeName = list.item(i);
            if (storeName) {
                db.deleteObjectStore(storeName);
            }
        }
    };
}

export default CommonDB;
