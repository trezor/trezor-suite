import { openDB, DBSchema, IDBPDatabase, unwrap } from 'idb';
import { migrate } from '@suite/storage/migrations';
import { State as WalletSettings } from '@wallet-reducers/settingsReducer';

const STORE_TXS = 'txs';
const STORE_SETTINGS = 'settings';

const VERSION = 11;
let db: IDBPDatabase<MyDBV1>;
// we reuse the same instance of broadcast channel for both sending the message
// and setting a listener, so the sender tab (source) won't receive its own messages
let broadcastChannel: BroadcastChannel;

// TODO: for typing migration/upgrade functions look at https://github.com/jakearchibald/idb#typescript

export interface WalletTransaction {
    id?: number;
    accountId: number;
    txId: string;
    timestamp: number;
    details: {
        name: string;
        price: number;
        productCode: string;
    };
}

export interface MyDBV1 extends DBSchema {
    txs: {
        key: string;
        value: WalletTransaction;
        indexes: { txId: string; accountId: number; timestamp: number };
    };
    settings: {
        key: string;
        value: WalletSettings;
    };
}

export interface StorageUpdateMessage {
    // TODO: only key strings from MyDBV1 should be allowed
    store: keyof MyDBV1;
    keys: string[];
}

export interface StorageMessageEvent extends MessageEvent {
    data: StorageUpdateMessage;
}

export const isIndexedDBAvailable = (cb: (isAvailable: boolean) => void) => {
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

export const notify = (
    store: StorageUpdateMessage['store'],
    keys: StorageUpdateMessage['keys'],
) => {
    // sends the message containing store, keys which were updated to other tabs/windows
    const message: StorageUpdateMessage = { store, keys };
    broadcastChannel.postMessage(message);
};

export const onChange = (handler: (event: StorageMessageEvent) => any) => {
    // listens to the channel. On receiving a message triggers the handler func
    broadcastChannel.onmessage = handler;
};

const onUpgrade = async (
    db: IDBPDatabase<MyDBV1>,
    oldVersion: number,
    newVersion: number | null,
    transaction: any,
    // transaction: IDBPTransaction<MyDBV1, "transactions"[]>,
) => {
    console.log('upgrade');
    console.log(oldVersion);
    console.log(newVersion);

    const shouldInitDB = oldVersion === 0;

    if (shouldInitDB) {
        // init db
        const txsStore = db.createObjectStore('txs', { keyPath: 'id', autoIncrement: true });
        txsStore.createIndex('txId', 'txId', { unique: true });
        txsStore.createIndex('timestamp', 'timestamp', { unique: false });
        txsStore.createIndex('accountId', 'accountId', { unique: false });
        db.createObjectStore('settings');
    } else {
        migrate(db, oldVersion, newVersion, transaction);
    }
};

const getDB = async () => {
    if (!db) {
        // if global var db is not already set then open new connection
        db = await openDB<MyDBV1>('trezor-suite', VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // Called if this version of the database has never been opened before. Use it to specify the schema for the database.
                onUpgrade(db, oldVersion, newVersion, transaction);
            },
            blocked() {
                // Called if there are older versions of the database open on the origin, so this version cannot open.
                console.log(
                    'Accessing the IDB is blocked by another window running older version.',
                );
            },
            blocking() {
                // Called if this connection is blocking a future version of the database from opening.
                console.log('This instance is blocking the IDB upgrade to new version.');
            },
        });

        // create global instance of broadcast channel
        broadcastChannel = new BroadcastChannel('storageChangeEvent');
    }
    return db;
};

export const addTransaction = async (transaction: MyDBV1['txs']['value']) => {
    // TODO: When using idb wrapper something throws 'Uncaught (in promise) null'
    // and I couldn't figure out how to catch it. Maybe a bug in idb?
    // So instead of using idb wrapper I use indexedDB directly, wrapped in my own promise.
    // @ts-ignore
    const db = unwrap(await getDB());
    const p = new Promise((resolve, reject) => {
        const tx = db.transaction('txs', 'readwrite');
        const req: IDBRequest = tx.objectStore('txs').add(transaction);
        req.onerror = _event => {
            reject(req.error);
        };
        req.onsuccess = _event => {
            notify('txs', [req.result]);
            resolve(req.result);
        };
    }).catch(err => {
        throw err;
    });
    return p;
};

export const addTransactions = async (transactions: MyDBV1['txs']['value'][]) => {
    const db = await getDB();
    const tx = db.transaction('txs', 'readwrite');

    const keys: string[] = [];
    transactions.forEach(transaction => {
        tx.store.add(transaction).then(result => {
            keys.push(result);
        });
    });
    notify('txs', keys);
    await tx.done;
};

export const getTransaction = async (txId: string) => {
    // returns the tx with txID
    const db = await getDB();
    const tx = db.transaction('txs');
    const txIdIndex = tx.store.index('txId');
    if (txId) {
        const tx = await txIdIndex.get(IDBKeyRange.only(txId));
        return tx;
    }
};

export const getTransactions = async (accountId?: number) => {
    // TODO: variant with cursor
    // returns all txs belonging to accountId
    const db = await getDB();
    const tx = db.transaction('txs');
    if (accountId) {
        const accountIdIndex = tx.store.index('accountId');
        const txs = await accountIdIndex.getAll(IDBKeyRange.only(accountId));
        return txs;
    }
    // return all txs
    const txs = await tx.store.getAll();
    return txs;
};

export const updateTransaction = async (txId: string, timestamp: number) => {
    const db = await getDB();
    const tx = db.transaction('txs', 'readwrite');
    const result = await tx.store.get(txId);
    if (result) {
        result.timestamp = timestamp;
        await tx.store.put(result);
        // @ts-ignore
        notify('txs', [result.id]);
    }
};

export const removeTransaction = async (txId: string) => {
    const db = await getDB();
    const tx = db.transaction('txs', 'readwrite');
    await tx.store.delete(txId);
};

export const saveWalletSettings = async (settings: MyDBV1['walletSettings']['value']) => {
    const db = await getDB();
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    // shortcut db.add throws null instead of ConstraintError on duplicate key (???)
    const result = await tx.store.put(settings, 'wallet');
    notify(STORE_SETTINGS, [result]);
    return result;
};

export const getWalletSettings = async () => {
    const db = await getDB();
    const tx = db.transaction(STORE_SETTINGS);
    const settings = await tx.store.get('wallet');
    return settings;
};
