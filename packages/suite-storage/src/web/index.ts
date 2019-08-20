import { openDB, IDBPDatabase } from 'idb';
import { migrate } from './migrations';
import {
    MyDBV1,
    StorageUpdateMessage as StorageUpdateMessage$,
    StorageMessageEvent,
} from './types';
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

import { isDBAvailable } from './utils';

const VERSION = 1;
let db: IDBPDatabase<MyDBV1>;
// we reuse the same instance of broadcast channel for both sending the message
// and setting a listener, so the sender tab (source) won't receive its own messages
let broadcastChannel: BroadcastChannel;
export type StorageUpdateMessage = StorageUpdateMessage$;

export const notify = (
    store: StorageUpdateMessage['store'],
    keys: StorageUpdateMessage['keys']
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
    transaction: any
    // transaction: IDBPTransaction<MyDBV1, "transactions"[]>,
) => {
    const shouldInitDB = oldVersion === 0;
    if (shouldInitDB) {
        // init db
        // object store for wallet transactions
        const txsStore = db.createObjectStore('txs', { keyPath: 'id', autoIncrement: true });
        txsStore.createIndex('txId', 'txId', { unique: true });
        txsStore.createIndex('type', 'type', { unique: false }); // sent/recv
        txsStore.createIndex('blockTime', 'blockTime', { unique: false });
        txsStore.createIndex('accountId', 'accountId', { unique: false });
        txsStore.createIndex('accountId-blockTime', ['accountId', 'blockTime'], {
            unique: false,
        });
        // object store for settings
        db.createObjectStore('suiteSettings');
        db.createObjectStore('walletSettings');
    } else {
        migrate(db, oldVersion, newVersion, transaction);
    }
};

export const getDB = async () => {
    if (!db) {
        try {
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
                        'Accessing the IDB is blocked by another window running older version.'
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
        } catch (error) {
            if (error && error.name === 'VersionError') {
                indexedDB.deleteDatabase('trezor-suite');
                console.log(
                    'SHOULD NOT HAPPEN IN PRODUCTION: IDB was deleted because your version is higher than it should be!'
                );
                throw error;
            } else {
                throw error;
            }
        }
    }
    return db;
};

export {
    saveSuiteSettings,
    saveWalletSettings,
    getSuiteSettings,
    getWalletSettings,
    addTransaction,
    addTransactions,
    getTransaction,
    getTransactions,
    updateTransaction,
    removeTransaction,
    isDBAvailable,
};
