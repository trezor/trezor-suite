import {
    EvoluDeps,
    createConsole,
    createRandom,
    createRandomBytes,
    createTime,
} from '@evolu/common';
import { DbWorkerPlatformDeps, createDbWorkerForPlatform } from '@evolu/common/local-first';

import { createFakeWebSocket } from './createFakeWebSocket';
import { createSqliteInMemoryDriver } from './createSqliteInMemoryDriver';

/**
 * Inspired by: https://github.com/evoluhq/evolu/blob/c80ab9b71a57e4d502002a463fd2e6cf42d00103/packages/common/test/local-first/Evolu.test.ts#L94
 */
export const createNodeEvoluDeps = (
    platformDeps: Partial<DbWorkerPlatformDeps> = {},
): EvoluDeps => {
    const innerDbWorker = createDbWorkerForPlatform({
        console: createConsole(),
        createSqliteDriver: createSqliteInMemoryDriver,
        createWebSocket: createFakeWebSocket,
        random: createRandom(),
        randomBytes: createRandomBytes(),
        time: createTime(),
        ...platformDeps,
    });

    return {
        console: createConsole(),
        createDbWorker: () => innerDbWorker,
        randomBytes: createRandomBytes(),
        reloadApp: () => {},
        time: createTime(),
    };
};
