import {
    CreateSqliteDriverDep,
    CreateWebSocket,
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
    testName,
} from '@evolu/common';
import {
    DbWorkerInit,
    SharedWorkerInput,
    initSharedWorker,
    startDbWorker,
} from '@evolu/common/local-first';
import { createBetterSqliteDriver } from '@evolu/nodejs';

export const testCreateSqliteDeps: CreateSqliteDriverDep = {
    createSqliteDriver: name => createBetterSqliteDriver(name, { mode: 'memory' }),
};

export const testCreateRunWithEvoluDeps = async ({
    createWebSocket,
}: {
    createWebSocket: CreateWebSocket;
}) => {
    const consoleStoreOutput = createConsoleStoreOutput();

    const run = testCreateRun({
        // console: createConsole({ level: "debug" }),
        createMessageChannel,
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createMessagePort,
        createWebSocket,
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
            workerRun(startDbWorker(self));
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
