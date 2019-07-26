import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { migrate } from '@suite/storage/migrations';

const VERSION = 9;
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
}

export interface StorageUpdateMessage {
    // TODO: only key strings from MyDBV1 should be allowed
    store: keyof MyDBV1;
    keys: string[];
}

export interface StorageMessageEvent extends MessageEvent {
    data: StorageUpdateMessage;
}

const isIndexedDBAvailable = () => {
    if (!('indexedDB' in window)) {
        return true;
    }
    return false;
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
        const store = db.createObjectStore('txs', { keyPath: 'id', autoIncrement: true });
        store.createIndex('txId', 'txId', { unique: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('accountId', 'accountId', { unique: false });
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
            },
            blocking() {
                // Called if this connection is blocking a future version of the database from opening.
            },
        });

        // create global instance of broadcast channel
        broadcastChannel = new BroadcastChannel('storageChangeEvent');
    }
    return db;
};

export const addTransaction = async (transaction: MyDBV1['txs']['value']) => {
    const db = await getDB();
    const tx = db.transaction('txs', 'readwrite');
    // shortcut db.add throws null instead of ConstraintError on duplicate key (???)
    const result = await tx.store.add(transaction);
    notify('txs', [result]);
    return result;
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

const load = async () => {
    if (!isIndexedDBAvailable()) {
        console.warn('IndexedDB not supported');
    }
};
