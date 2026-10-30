import type { SqlRow, TransactionStoreSqlite } from '@suite-common/transaction-store';

import type { SqliteWorkerRequest, SqliteWorkerResponse } from './sqliteWorkerProtocol';

type PendingCall = { resolve: (rows: SqlRow[]) => void; reject: (error: Error) => void };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type WorkerSqlite = TransactionStoreSqlite & {
    /** Closes the database and deletes it from the device. */
    deleteDatabase: () => Promise<void>;
    /** Fails the calls still waiting; the caller then ends the worker. */
    dispose: () => void;
};

/** The SQLite of `transactionStoreSqliteWorker`, called from the app. */
export const createWorkerSqlite = (worker: Worker): WorkerSqlite => {
    const pendingCalls = new Map<number, PendingCall>();
    let nextId = 0;

    const onMessage = ({ data }: MessageEvent<SqliteWorkerResponse>) => {
        const pendingCall = pendingCalls.get(data.id);
        pendingCalls.delete(data.id);

        if (data.isOk) {
            pendingCall?.resolve(data.rows);
        } else {
            pendingCall?.reject(new Error('SQLite call failed'));
        }
    };
    worker.addEventListener('message', onMessage);

    const call = (request: DistributiveOmit<SqliteWorkerRequest, 'id'>) =>
        new Promise<SqlRow[]>((resolve, reject) => {
            const id = nextId++;
            pendingCalls.set(id, { resolve, reject });
            worker.postMessage({ ...request, id });
        });

    return {
        exec: query => call({ type: 'exec', query }),
        execBatch: async queries => {
            await call({ type: 'execBatch', queries });
        },
        select: query => call({ type: 'select', query }),
        deleteDatabase: async () => {
            await call({ type: 'deleteDatabase' });
        },
        dispose: () => {
            worker.removeEventListener('message', onMessage);
            pendingCalls.forEach(({ reject }) => reject(new Error('SQLite was disposed')));
            pendingCalls.clear();
        },
    };
};
