import {
    type CreateSqliteDriver,
    type SqliteDriver,
    type SqliteRow,
    createConsole,
    createPreparedStatementsCache,
    createRandom,
    createRandomBytes,
    createTime,
    createWebSocket,
} from '@evolu/common';
import { createDbWorkerForPlatform } from '@evolu/common/local-first';
import BetterSqlite3, { type Statement } from 'better-sqlite3';
import { WebSocket } from 'ws';

const createSqliteDriver: CreateSqliteDriver = () => {
    const db = new BetterSqlite3(':memory:');

    let isDisposed = false;

    const cache = createPreparedStatementsCache<Statement>(
        sql => db.prepare(sql),
        () => undefined,
    );

    const driver: SqliteDriver = {
        exec: (query, isMutation) => {
            // Always prepare is recommended for better-sqlite3
            const prepared = cache.get(query, true);
            const rows = isMutation ? [] : (prepared.all(query.parameters) as Array<SqliteRow>);
            const changes = isMutation ? prepared.run(query.parameters).changes : 0;

            return { rows, changes };
        },

        export: () => db.serialize(),

        [Symbol.dispose]: () => {
            if (isDisposed) return;
            isDisposed = true;
            cache[Symbol.dispose]();
            db.close();
        },
    };

    return Promise.resolve(driver);
};

export const createNodeEvoluDeps = () => {
    const innerDbWorker = createDbWorkerForPlatform({
        console: createConsole(),
        createSqliteDriver,
        createWebSocket: (url, options) =>
            createWebSocket(url, {
                ...options,
                WebSocketConstructor: WebSocket as unknown as typeof globalThis.WebSocket,
            }),
        random: createRandom(),
        randomBytes: createRandomBytes(),
        time: createTime(),
    });

    return {
        console: createConsole(),
        createDbWorker: () => innerDbWorker,
        randomBytes: createRandomBytes(),
        reloadApp: () => {},
        time: createTime(),
    };
};
