import {
    openDB,
    IDBPDatabase,
    unwrap,
    StoreNames,
    StoreKey,
    IndexNames,
    IndexKey,
    StoreValue,
} from 'idb';
import { StorageUpdateMessage, StorageMessageEvent } from './types';

// const VERSION = 1;

class CommonDB<TDBStructure> {
    private static instance: CommonDB<any>;
    dbName!: string;
    version!: number;
    db!: IDBPDatabase<TDBStructure> | null;
    broadcastChannel!: BroadcastChannel;
    onUpgrade!: (
        db: IDBPDatabase<TDBStructure>,
        oldVersion: number,
        newVersion: number | null,
        transaction: any
    ) => void;

    constructor(
        dbName: string,
        version: number,
        onUpgrade: (
            db: IDBPDatabase<TDBStructure>,
            oldVersion: number,
            newVersion: number | null,
            transaction: any
        ) => void
    ) {
        if (CommonDB.instance) {
            return CommonDB.instance;
        }

        this.dbName = dbName;
        this.version = version;
        this.onUpgrade = onUpgrade.bind(this);
        this.db = null;
        // create global instance of broadcast channel
        this.broadcastChannel = new BroadcastChannel('storageChangeEvent');

        CommonDB.instance = this;
    }

    static isDBAvailable = (cb: (isAvailable: boolean) => void) => {
        // Firefox doesn't support indexedDB while in incognito mode, but still returns valid window.indexedDB object.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=781982
        // so we need to try accessing the IDB. try/catch around idb.open() does not catch the error (bug in idb?), that's why we use callbacks.
        // this solution calls callback function from within onerror/onsuccess event handlers.
        // For other browsers checking the window.indexedDB should be enough.
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        if (isFirefox) {
            const r = indexedDB.open('test');
            r.onerror = () => cb(false);
            r.onsuccess = () => cb(true);
        } else {
            cb(!!indexedDB);
        }
    };

    notify = (store: StoreNames<TDBStructure>, keys: any[]) => {
        // sends the message containing store, keys which were updated to other tabs/windows
        const message = { store, keys };
        this.broadcastChannel.postMessage(message);
    };

    onChange = (handler: (event: StorageMessageEvent<TDBStructure>) => any) => {
        // listens to the channel. On receiving a message triggers the handler func
        this.broadcastChannel.onmessage = handler;
    };

    getDB = async () => {
        if (!this.db) {
            try {
                // if global var db is not already set then open new connection
                this.db = await openDB<TDBStructure>(this.dbName, this.version, {
                    upgrade: (db, oldVersion, newVersion, transaction) => {
                        // Called if this version of the database has never been opened before. Use it to specify the schema for the database.
                        this.onUpgrade(db, oldVersion, newVersion, transaction);
                    },
                    blocked: () => {
                        // Called if there are older versions of the database open on the origin, so this version cannot open.
                        // TODO
                        console.log(
                            'Accessing the IDB is blocked by another window running older version.'
                        );
                    },
                    blocking: () => {
                        // Called if this connection is blocking a future version of the database from opening.
                        // TODO
                        console.log('This instance is blocking the IDB upgrade to new version.');
                    },
                });
            } catch (error) {
                if (error && error.name === 'VersionError') {
                    indexedDB.deleteDatabase(this.dbName);
                    console.log(
                        'SHOULD NOT HAPPEN IN PRODUCTION: IDB was deleted because your version is higher than it should be!'
                    );
                    throw error;
                } else {
                    throw error;
                }
            }
        }
        return this.db;
    };

    addItem = async <
        TStoreName extends StoreNames<TDBStructure>,
        TItem extends StoreValue<TDBStructure, TStoreName>,
        TKey extends StoreKey<TDBStructure, TStoreName>
    >(
        store: TStoreName,
        item: TItem,
        key?: TKey
    ): Promise<StoreKey<TDBStructure, TStoreName>> => {
        // TODO: When using idb wrapper something throws 'Uncaught (in promise) null'
        // and I couldn't figure out how to catch it. Maybe a bug in idb?
        // So instead of using idb wrapper I use indexedDB directly, wrapped in my own promise.
        // @ts-ignore
        const db = unwrap(await this.getDB());

        const p = new Promise<StoreKey<TDBStructure, TStoreName>>((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            const req: IDBRequest = key
                ? tx.objectStore(store).put(item, key)
                : tx.objectStore(store).add(item);
            req.onerror = _event => {
                reject(req.error);
            };
            req.onsuccess = _event => {
                this.notify(store, [req.result]);
                resolve(req.result);
            };
        });
        return p;
    };

    addItems = async (store: StoreNames<TDBStructure>, items: any[]) => {
        const db = await this.getDB();
        const tx = db.transaction(store, 'readwrite');

        const keys: string[] = [];
        items.forEach(item => {
            tx.store.add(item).then(result => {
                keys.push(result as string); // TODO: it seems that name of an object store could be string or number
            });
        });
        this.notify(store, keys);
        await tx.done;
    };

    // TODO: It would be awesome if return type could be something like Promise<StoreValue<TDBStructure, store>>
    getItemByPK = async <
        TStoreName extends StoreNames<TDBStructure>,
        TKey extends StoreKey<TDBStructure, TStoreName>
    >(
        store: TStoreName,
        primaryKey: TKey
    ): Promise<StoreValue<TDBStructure, TStoreName> | undefined> => {
        const db = await this.getDB();
        const tx = db.transaction(store);
        const item = await tx.store.get(primaryKey);
        return item;
    };

    getItemByIndex = async <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>
    >(
        store: TStoreName,
        indexName: TIndexName,
        key: TKey
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
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>
    >(
        store: TStoreName,
        indexName: TIndexName,
        key: TKey,
        updateObject: { [key: string]: any }
    ) => {
        const db = await this.getDB();
        const tx = db.transaction(store, 'readwrite');
        const index = tx.store.index(indexName);
        const result = await index.get(key);
        if (result) {
            Object.assign(result, updateObject);
            this.notify(store, [result]);
            return tx.store.put(result);
        }
    };

    removeItemByPK = async <
        TStoreName extends StoreNames<TDBStructure>,
        TKey extends StoreKey<TDBStructure, TStoreName>
    >(
        store: TStoreName,
        key: TKey
    ) => {
        const db = await this.getDB();
        const tx = db.transaction(store, 'readwrite');
        const res = await tx.store.delete(key);
        // TODO: needs to differentiate between PKs, Index keys...
        // if (res) {
        //     this.notify(store, [key]);
        // }
    };

    removeItemByIndex = async <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>
    >(
        store: TStoreName,
        indexName: TIndexName,
        key: TKey
    ) => {
        const db = await this.getDB();
        const tx = db.transaction(store, 'readwrite');
        const txIdIndex = tx.store.index(indexName);
        const p = await txIdIndex.openCursor(IDBKeyRange.only(key));
        if (p) {
            p.delete();
            this.notify(store, p.value ? [p.value] : []);
        }
    };

    getItemsExtended = async <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>
    >(
        store: TStoreName,
        indexName?: TIndexName,
        filters?: { key?: any; offset?: number; count?: number }
    ) => {
        // TODO: indexName !== undefined && filters === undefined
        const db = await this.getDB();
        const tx = db.transaction(store);
        if (filters && indexName && filters.key !== undefined) {
            if (filters.offset !== undefined || filters.count !== undefined) {
                const index = tx.store.index(indexName);
                // cursor with keyrange for given accountId (covers all timestamps)
                let cursor = await index.openCursor(
                    IDBKeyRange.bound([filters.key], [filters.key, ''])
                );
                const items = [];
                let counter = 0;
                if (cursor) {
                    // move cursor in position
                    if (filters.offset) cursor = await cursor.advance(filters.offset);
                    while (cursor && (!filters.count || counter < filters.count)) {
                        // iterate unless cursor returns null or we have enough items (count param)
                        items.push(cursor.value);
                        // eslint-disable-next-line no-await-in-loop
                        cursor = await cursor.continue();
                        counter++;
                    }
                }
                return items;
            }
            // if offset and count params are undefined just use getAll on index instead of cursor.
            const index = tx.store.index(indexName);
            // all txs for given accountId
            // bound([accountId, undefined], [accountId, '']) should cover all timestamps
            const keyRange = IDBKeyRange.bound([filters.key], [filters.key, '']);
            const items = await index.getAll(keyRange);
            return items;
        }
        // no accountId, return all txs
        const items = await tx.store.getAll();
        return items;
    };
}

export default CommonDB;
export { StorageUpdateMessage };
