import { unwrap } from 'idb';
import { MyDBV1, STORE_TXS } from '@suite/storage/types/index';
import { notify, getDB } from '@suite/storage';

export const addTransaction = async (transaction: MyDBV1['txs']['value']) => {
    // TODO: When using idb wrapper something throws 'Uncaught (in promise) null'
    // and I couldn't figure out how to catch it. Maybe a bug in idb?
    // So instead of using idb wrapper I use indexedDB directly, wrapped in my own promise.
    // @ts-ignore
    const db = unwrap(await getDB());
    const p = new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_TXS, 'readwrite');
        const req: IDBRequest = tx.objectStore(STORE_TXS).add(transaction);
        req.onerror = _event => {
            reject(req.error);
        };
        req.onsuccess = _event => {
            notify(STORE_TXS, [req.result]);
            resolve(req.result);
        };
    }).catch(err => {
        throw err;
    });
    return p;
};

export const addTransactions = async (transactions: MyDBV1['txs']['value'][]) => {
    const db = await getDB();
    const tx = db.transaction(STORE_TXS, 'readwrite');

    const keys: string[] = [];
    transactions.forEach(transaction => {
        tx.store.add(transaction).then(result => {
            keys.push(result);
        });
    });
    notify(STORE_TXS, keys);
    await tx.done;
};

export const getTransaction = async (txId: string) => {
    // returns the tx with txID
    const db = await getDB();
    const tx = db.transaction(STORE_TXS);
    const txIdIndex = tx.store.index('txId');
    if (txId) {
        const tx = await txIdIndex.get(IDBKeyRange.only(txId));
        return tx;
    }
};

export const getTransactions = async (accountId?: number, from?: number, to?: number) => {
    // TODO: Params from/to are just an example on using multiple indeces.
    // They are now referring to id field of the transaction.
    // Later it should be changed to something more useful (block height?)
    // TODO: variant with cursor
    // returns all txs belonging to accountId
    const db = await getDB();
    const tx = db.transaction(STORE_TXS);
    if (accountId !== undefined) {
        if (from !== undefined || to !== undefined) {
            // if 'from' or 'to' param is passed use a compound index
            const index = tx.store.index('accountId-id');
            if (from && to) {
                const txs = await index.getAll(
                    IDBKeyRange.bound([accountId, from], [accountId, to]),
                );
                return txs;
            }
            if (from && !to) {
                const lowerBound = IDBKeyRange.lowerBound([accountId, from]);
                const txs = await index.getAll(lowerBound);
                return txs;
            }
            if (!from && to) {
                const upperBound = IDBKeyRange.upperBound([accountId, to]);
                const txs = await index.getAll(upperBound);
                return txs;
            }
            // eslint-disable-next-line no-else-return
        } else {
            const index = tx.store.index('accountId');
            const txs = await index.getAll(IDBKeyRange.only(accountId));
            return txs;
        }
    }
    // return all txs
    const txs = await tx.store.getAll();
    return txs;
};

export const updateTransaction = async (txId: string, timestamp: number) => {
    const db = await getDB();
    const tx = db.transaction(STORE_TXS, 'readwrite');
    const result = await tx.store.get(txId);
    if (result) {
        result.timestamp = timestamp;
        await tx.store.put(result);
        // @ts-ignore
        notify(STORE_TXS, [result.id]);
    }
};

export const removeTransaction = async (txId: string) => {
    const db = await getDB();
    const tx = db.transaction(STORE_TXS, 'readwrite');
    const txIdIndex = tx.store.index('txId');
    const p = await txIdIndex.openCursor(IDBKeyRange.only(txId));
    if (p) p.delete();
};
