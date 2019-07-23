import { openDB, DBSchema, IDBPDatabase, IDBPTransaction, deleteDB, wrap, unwrap } from 'idb';

const VERSION = 1;
let db: IDBPDatabase<MyDBV1>;
// react-native https://facebook.github.io/react-native/docs/asyncstorage.html

// next.js https://medium.com/@filipvitas/indexeddb-with-promises-and-async-await-3d047dddd313

// https://github.com/jakearchibald/idb#typescript

interface MyDBV1 extends DBSchema {
    txs: {
        key: string;
        value: {
            id?: number;
            accountId: number;
            txId: string;
            details: {
                name: string;
                price: number;
                productCode: string;
            };
        };
        indexes: { txId: string; accountId: number };
    };
}

const isIndexedDBAvailable = () => {
    if (!('indexedDB' in window)) {
        return true;
    }
    return false;
};

const onUpgrade = (
    db: IDBPDatabase<MyDBV1>,
    oldVersion: number,
    newVersion: number | null,
    transaction: any,
    // transaction: IDBPTransaction<MyDBV1, "transactions"[]>,
) => {
    console.log('upgrade');
    console.log(oldVersion);
    console.log(newVersion);
    const store = db.createObjectStore('txs', { keyPath: 'id', autoIncrement: true });
    store.createIndex('txId', 'txId', { unique: true });
    store.createIndex('accountId', 'accountId', { unique: false });
};

const getDB = async () => {
    if (!db) {
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
    }
    return db;
};

export const addTransaction = async (transaction: MyDBV1['txs']['value']) => {
    const db = await getDB();
    const result = await db.add('txs', transaction);
    return result;
};

export const addTransactions = async (transactions: MyDBV1['txs']['value'][]) => {
    const db = await getDB();
    const tx = db.transaction('txs', 'readwrite');

    transactions.forEach(transaction => {
        tx.store.add(transaction);
    });
    await tx.done;
};

export const getTransaction = async (txId: string) => {
    const db = await getDB();
    const tx = db.transaction('txs');
    const txIdIndex = tx.store.index('txId');
    // find the tx with txID
    if (txId) {
        const tx = await txIdIndex.get(IDBKeyRange.only(txId));
        return tx;
    }
};

export const getTransactions = async (accountId?: number) => {
    const db = await getDB();
    const tx = db.transaction('txs');
    if (accountId) {
        // find all txs belonging to accountId
        const accountIdIndex = tx.store.index('accountId');
        const txs = await accountIdIndex.getAll(IDBKeyRange.only(accountId));
        return txs;
    }
    // return all txs
    const txs = await tx.store.getAll();
    return txs;
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
