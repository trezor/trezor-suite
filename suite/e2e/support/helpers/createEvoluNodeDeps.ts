import {
    SimpleName,
    createConsole,
    createPreparedStatementsCache,
    createRandom,
    createRandomBytes,
    createSqlite,
    createTime,
    createWebSocket,
    getOrThrow,
} from '@evolu/common';
import {
    type DbWorkerInput,
    type DbWorkerOutput,
    createDbWorkerForPlatform,
} from '@evolu/common/local-first';
import BetterSqlite3, { type Statement } from 'better-sqlite3';
import { WebSocket } from 'ws';

let instanceCounter = 0;

export const createNodeEvoluDeps = async () => {
    const instanceName = SimpleName.orThrow(`Test${instanceCounter++}`);

    // eslint-disable-next-line require-await
    const createSqliteDriver = async () => {
        let disposed = false;
        //TODO: db init here means it can be initilized multiple times
        // Consider rework
        const db = new BetterSqlite3(':memory:');

        const cache = createPreparedStatementsCache<Statement>(
            sql => db.prepare(sql),
            () => {},
        );

        const driver = {
            exec: (query: any, isMutation?: boolean) => {
                const prepared = cache.get(query, true);
                const rows = isMutation ? [] : (prepared.all(query.parameters) as any[]);
                const changes = isMutation ? prepared.run(query.parameters).changes : 0;

                return { rows, changes };
            },
            export: () => db.serialize(),
            [Symbol.dispose]: () => {
                if (disposed) return;
                disposed = true;
                cache[Symbol.dispose]();
                db.close();
            },
        } as const;

        return driver;
    };

    // track postMessage calls (handy for tests)
    const postMessageCalls: Array<DbWorkerInput> = [];
    let onMessageCallback: ((message: DbWorkerOutput) => void) | undefined;

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

    // expose createDbWorker for the platform (in-memory bridge to innerDbWorker)
    const deps = {
        console: createConsole(),
        createDbWorker: () => ({
            onMessage: (cb: (m: DbWorkerOutput) => void) => {
                onMessageCallback = cb;
                innerDbWorker.onMessage(cb);
            },
            postMessage: (message: Parameters<typeof innerDbWorker.postMessage>[0]) => {
                postMessageCalls.push(message);
                innerDbWorker.postMessage(message);
            },
        }),
        randomBytes: createRandomBytes(),
        reloadApp: () => {},
        time: createTime(),
    };

    // create sqlite instance (optional, useful to inspect DB)
    const sqlite = getOrThrow(await createSqlite({ createSqliteDriver })(instanceName));

    return {
        instanceName,
        deps,
        postMessageCalls,
        sqlite,
        innerDbWorker,
        getOnMessageCallback: () => onMessageCallback,
    };
};
