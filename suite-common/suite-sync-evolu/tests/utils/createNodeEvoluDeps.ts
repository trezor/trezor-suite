import {
    EvoluDeps,
    createConsole,
    createRandom,
    createRandomBytes,
    createTime,
} from '@evolu/common';
import {
    DbWorkerInput,
    DbWorkerOutput,
    DbWorkerPlatformDeps,
    createDbWorkerForPlatform,
} from '@evolu/common/local-first';

import { createFakeWebSocket } from './createFakeWebSocket';
import { createSqliteInMemoryDriver } from './createSqliteInMemoryDriver';

/**
 * Inspired by: https://github.com/evoluhq/evolu/blob/c80ab9b71a57e4d502002a463fd2e6cf42d00103/packages/common/test/local-first/Evolu.test.ts#L94
 */
export const createNodeEvoluDeps = (platformDeps: Partial<DbWorkerPlatformDeps> = {}) => {
    const innerDbWorker = createDbWorkerForPlatform({
        console: createConsole(),
        createSqliteDriver: createSqliteInMemoryDriver,
        createWebSocket: createFakeWebSocket,
        random: createRandom(),
        randomBytes: createRandomBytes(),
        time: createTime(),
        ...platformDeps,
    });

    const postMessageCalls: Array<DbWorkerInput> = [];

    const evoluDeps: EvoluDeps = {
        console: createConsole(),
        createDbWorker: () => ({
            onMessage: (callback: (message: DbWorkerOutput) => void) => {
                innerDbWorker.onMessage(callback);
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

    return {
        evoluDeps,
        postMessageCalls,
    };
};
