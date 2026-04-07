import {
    type CreateSqliteDriver,
    type CreateWebSocket,
    type SqliteDriver,
    type SqliteRow,
    createConsole,
    createConsoleStoreOutput,
    createInMemoryLeaderLock,
    createMessageChannel,
    createMessagePort,
    createPreparedStatementsCache,
    createRun,
    createSharedWorker,
    createWebSocket,
    createWorker,
    lazyVoid,
    ok,
} from '@evolu/common';
import {
    type DbWorkerInit,
    type SharedWorkerInput,
    initSharedWorker,
    startDbWorker,
} from '@evolu/common/local-first';
import BetterSqlite3, { type Statement } from 'better-sqlite3';
import { WebSocket } from 'ws';

const createSqliteDriver: CreateSqliteDriver = (_name, options) => () => {
    const filename = options?.mode === 'memory' ? ':memory:' : `${_name}.db`;
    const db = new BetterSqlite3(filename);
    let isDisposed = false;

    const cache = createPreparedStatementsCache<Statement>(sql => db.prepare(sql), lazyVoid);

    const driver: SqliteDriver = {
        exec: query => {
            const prepared = cache.get(query, true);
            if (prepared.reader) {
                return { rows: prepared.all(query.parameters) as Array<SqliteRow>, changes: 0 };
            }
            const { changes } = prepared.run(query.parameters);

            return { rows: [], changes };
        },

        export: () => {
            const file = db.serialize();
            const { buffer } = file;
            if (buffer instanceof ArrayBuffer) {
                return new Uint8Array(buffer, file.byteOffset, file.byteLength);
            }

            return new Uint8Array(file);
        },

        [Symbol.dispose]: () => {
            if (isDisposed) return;
            isDisposed = true;
            cache[Symbol.dispose]();
            db.close();
        },
    };

    return ok(driver);
};

export const createNodeEvoluDeps = () => {
    const consoleStoreOutput = createConsoleStoreOutput();
    const console = createConsole({ output: consoleStoreOutput });

    const run = createRun({
        console,
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createMessageChannel,
        createMessagePort,
        createWebSocket: ((url, options) =>
            createWebSocket(url, {
                ...options,
                WebSocketConstructor: WebSocket as unknown as typeof globalThis.WebSocket,
            })) as CreateWebSocket,
    });

    const workerRun = createRun({
        console,
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createMessagePort,
        leaderLock: createInMemoryLeaderLock(),
        createSqliteDriver,
    });

    const createDbWorker = () =>
        createWorker<DbWorkerInit>(self => {
            workerRun(startDbWorker(self));
        });

    const sharedWorker = createSharedWorker<SharedWorkerInput>(self => {
        run(initSharedWorker(self));
    });

    return run.addDeps({
        createDbWorker,
        reloadApp: () => {},
        sharedWorker,
    });
};
