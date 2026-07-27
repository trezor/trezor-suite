import {
    CreateSqliteDriverDep,
    CreateWebSocket,
    createBroadcastChannel,
    createConsoleStoreOutput,
    createMessageChannel,
    createMessagePort,
    createSharedWorker,
    createWorker,
    testCreateLockManager,
    testCreateRun,
} from '@evolu/common';
import {
    type CreateDbWorker,
    type DbWorkerInit,
    type EvoluPlatformDeps,
    type SharedWorkerInput,
    type SharedWorkerOutput,
    createEvoluDeps,
    initSharedWorker,
    startDbWorker,
} from '@evolu/common/local-first';
import { createBetterSqliteDriver } from '@evolu/nodejs';

export const testCreateSqliteDeps: CreateSqliteDriverDep = {
    createSqliteDriver: name => createBetterSqliteDriver(name, { mode: 'memory' }),
};

export const testCreateRunWithEvoluDeps = ({
    createWebSocket,
}: {
    createWebSocket: CreateWebSocket;
}) => {
    const consoleStoreOutput = createConsoleStoreOutput();
    const lockManager = testCreateLockManager();

    const sharedWorkerRun = testCreateRun({
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createBroadcastChannel,
        createMessageChannel,
        createMessagePort,
        createWebSocket,
        lockManager,
    });

    const dbWorkerRun = testCreateRun({
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createBroadcastChannel,
        createMessagePort,
        lockManager,
        createSqliteDriver: testCreateSqliteDeps.createSqliteDriver,
    });

    const createDbWorker: CreateDbWorker = () =>
        createWorker<DbWorkerInit>(self => {
            dbWorkerRun(startDbWorker(self));
        });

    const sharedWorker = createSharedWorker<SharedWorkerInput, SharedWorkerOutput>(self => {
        sharedWorkerRun(initSharedWorker(self));
    });

    const platformDeps: EvoluPlatformDeps = {
        console: sharedWorkerRun.deps.console,
        createBroadcastChannel,
        createDbWorker,
        createMessageChannel,
        lockManager,
        reloadApp: () => {},
        sharedWorker,
    };

    const evoluDeps = createEvoluDeps(platformDeps);
    const run = testCreateRun(evoluDeps);
    run.onAbort(() => evoluDeps[Symbol.dispose]());

    return run;
};
