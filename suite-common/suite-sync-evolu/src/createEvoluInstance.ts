import { AppName, createEvolu, deriveShardOwner, getOrThrow } from '@evolu/common';
import { type Evolu, type Run, type ShardOwner } from '@evolu/common';
import { type EvoluPlatformDeps } from '@evolu/common/local-first';

import { type SuiteSyncOwner } from '@suite-common/suite-sync-storage';

import { createEvoluAppOwnerFromTrezorData } from './createEvoluAppOwnerFromTrezorData';
import { Schema } from './schema';

// This is a way how to force change of the SQL files. It was useful for development
// so not everybody had to delete SQLite file manually:
// See: https://www.evolu.dev/docs/faq#how-to-delete-opfs-sqlite-in-browser
const VERSION = 9;

type CreateEvoluInstanceFactoryDeps = {
    run: Run<EvoluPlatformDeps>;
};

export type CreateEvoluInstance = (params: { suiteSyncOwner: SuiteSyncOwner }) => Promise<{
    evolu: Evolu<typeof Schema>;
    shardOwner: ShardOwner;
}>;

export type CreateEvoluInstanceDep = {
    createEvoluInstance: CreateEvoluInstance;
};

export const createEvoluInstanceFactory =
    (deps: CreateEvoluInstanceFactoryDeps): CreateEvoluInstance =>
    async ({ suiteSyncOwner }) => {
        const appOwner = createEvoluAppOwnerFromTrezorData({ data: suiteSyncOwner.ownerSecret });

        if (!appOwner.ok) {
            console.error(appOwner.error);

            throw appOwner.error;
        }

        const shardOwner = deriveShardOwner(appOwner.value, ['trezor-suite', '1']);

        const appName = AppName.from(`trezor-suite-v${VERSION}`);

        if (!appName.ok) {
            console.error(appName.error);

            throw appName.error;
        }

        const evolu = getOrThrow(
            await deps.run(
                createEvolu(Schema, {
                    appName: appName.value,
                    // Intentionally no transport, transport will be passed
                    // later on, so we can change the RelayUrl at any time.
                    transports: [],
                    appOwner: appOwner.value,
                }),
            ),
        );

        return {
            evolu,
            shardOwner,
        };
    };
