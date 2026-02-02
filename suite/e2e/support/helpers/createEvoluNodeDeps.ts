import {
    SimpleName,
    createConsole,
    createRandom,
    createRandomBytes,
    createSqlite,
    createTestTime,
    createWebSocket,
    getOrThrow,
} from '@evolu/common';
import {
    type DbWorkerInput,
    type DbWorkerOutput,
    createDbWorkerForPlatform,
} from '@evolu/common/local-first';
import { WebSocket } from 'ws';

let instanceCounter = 0;

const createNodeWebSocketDep = () => ({
    createWebSocket: (url: string, options?: any) =>
        createWebSocket(url, {
            ...options,
            WebSocketConstructor: WebSocket as unknown as typeof globalThis.WebSocket,
        }),
});

export const createNodeEvoluDeps = async () => {
    const instanceName = SimpleName.orThrow(`Test${instanceCounter++}`);

    const createSqliteDriver = async () => {
        const BetterSQLite = (await import('better-sqlite3')).default;
        type Statement = import('better-sqlite3').Statement;
        const db = new BetterSQLite(':memory:');
        let disposed = false;

        const cache = (await import('@evolu/common')).createPreparedStatementsCache<Statement>(
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

    // inner worker (actual DB worker implementation)
    const nodeWebSocketDep = createNodeWebSocketDep();

    const innerDbWorker = createDbWorkerForPlatform({
        console: createConsole(),
        createSqliteDriver,
        createWebSocket: nodeWebSocketDep.createWebSocket as any,
        random: createRandom(),
        randomBytes: createRandomBytes(),
        time: createTestTime(),
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
        reloadApp: () => {}, // noop
        time: createTestTime(),
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
