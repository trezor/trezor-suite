import {
    type CreateSqliteDriverDep,
    type CreateWebSocket,
    createConsole,
    createConsoleStoreOutput,
    createInMemoryLeaderLock,
    createMessageChannel,
    createMessagePort,
    createRun,
    createSharedWorker,
    createWebSocket,
    createWorker,
} from '@evolu/common';
import {
    type DbWorkerInit,
    type SharedWorkerInput,
    initSharedWorker,
    startDbWorker,
} from '@evolu/common/local-first';
import { createBetterSqliteDriver } from '@evolu/nodejs';
import { WebSocket } from 'ws';

const isolatedInMemorySqliteDeps: CreateSqliteDriverDep = {
    createSqliteDriver: name => createBetterSqliteDriver(name, { mode: 'memory' }),
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
        createSqliteDriver: isolatedInMemorySqliteDeps.createSqliteDriver,
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
