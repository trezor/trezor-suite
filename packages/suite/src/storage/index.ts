import { openDB, IDBPDatabase } from 'idb';
import { migrate } from '@suite/storage/migrations';
import { MyDBV1, StorageUpdateMessage, StorageMessageEvent } from './types';
import {
    saveSuiteSettings,
    saveWalletSettings,
    getSuiteSettings,
    getWalletSettings,
} from './stores/settings/index';
import {
    addTransaction,
    addTransactions,
    getTransaction,
    getTransactions,
    updateTransaction,
    removeTransaction,
} from './stores/transactions/index';

const VERSION = 1;
let db: IDBPDatabase<MyDBV1>;
// we reuse the same instance of broadcast channel for both sending the message
// and setting a listener, so the sender tab (source) won't receive its own messages
let broadcastChannel: BroadcastChannel;

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

// TODO: for typing migration/upgrade functions look at https://github.com/jakearchibald/idb#typescript
const onUpgrade = async (
    db: IDBPDatabase<MyDBV1>,
    oldVersion: number,
    newVersion: number | null,
    transaction: any,
    // transaction: IDBPTransaction<MyDBV1, "transactions"[]>,
) => {
    const shouldInitDB = oldVersion === 0;
    if (shouldInitDB) {
        // init db
        try {
            const txsStore = db.createObjectStore('txs', { keyPath: 'id', autoIncrement: true });
            txsStore.createIndex('txId', 'txId', { unique: true });
            txsStore.createIndex('timestamp', 'timestamp', { unique: false });
            txsStore.createIndex('accountId', 'accountId', { unique: false });
            txsStore.createIndex('accountId-timestamp', ['accountId', 'timestamp'], {
                unique: false,
            });
            db.createObjectStore('suiteSettings');
            db.createObjectStore('walletSettings');
        } catch (err) {
            console.error(err);
        }
    } else {
        migrate(db, oldVersion, newVersion, transaction);
    }
};

export const getDB = async () => {
    if (!db) {
        // if global var db is not already set then open new connection
        db = await openDB<MyDBV1>('trezor-suite', VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // Called if this version of the database has never been opened before. Use it to specify the schema for the database.
                onUpgrade(db, oldVersion, newVersion, transaction);
            },
            blocked() {
                // Called if there are older versions of the database open on the origin, so this version cannot open.
                // TODO
                console.log(
                    'Accessing the IDB is blocked by another window running older version.',
                );
            },
            blocking() {
                // Called if this connection is blocking a future version of the database from opening.
                // TODO
                console.log('This instance is blocking the IDB upgrade to new version.');
            },
        });

        // create global instance of broadcast channel
        broadcastChannel = new BroadcastChannel('storageChangeEvent');
    }
    return db;
};

export { saveSuiteSettings, saveWalletSettings, getSuiteSettings, getWalletSettings };
export {
    addTransaction,
    addTransactions,
    getTransaction,
    getTransactions,
    updateTransaction,
    removeTransaction,
};
