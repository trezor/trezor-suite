import {
    CreateSqliteDriverDep,
    createConsoleStoreOutput,
    createInMemoryLeaderLock,
    createMessageChannel,
    createMessagePort,
    createSharedWorker,
    createSqlite,
    createWorker,
    lazyVoid,
    ok,
    testCreateRun,
    testCreateWebSocket,
    testName,
} from '@evolu/common';
import {
    DbWorkerInit,
    SharedWorkerInput,
    initDbWorker,
    initSharedWorker,
} from '@evolu/common/local-first';

import { createBetterSqliteDriver } from './createBetterSqliteDriver';

export const testCreateSqliteDeps: CreateSqliteDriverDep = {
    createSqliteDriver: name => createBetterSqliteDriver(name, { mode: 'memory' }),
};

export const testCreateRunWithEvoluDeps = async () => {
    const consoleStoreOutput = createConsoleStoreOutput();

    const run = testCreateRun({
        // console: createConsole({ level: "debug" }),
        createMessageChannel,
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createMessagePort,
        createWebSocket: testCreateWebSocket({ throwOnCreate: true }),
    });

    const driver = await run.orThrow(testCreateSqliteDeps.createSqliteDriver(testName));

    const workerRun = testCreateRun({
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createMessagePort,
        leaderLock: createInMemoryLeaderLock(),
        createSqliteDriver: () => () => ok(driver),
    });

    const createDbWorker = () =>
        createWorker<DbWorkerInit>(self => {
            workerRun(initDbWorker(self));
        });

    const sharedWorker = createSharedWorker<SharedWorkerInput>(self => {
        run(initSharedWorker(self));
    });

    const sqlite = await workerRun.orThrow(createSqlite(testName));

    return run.addDeps({
        createDbWorker,
        reloadApp: lazyVoid,
        sharedWorker,
        sqlite,
    });
};
