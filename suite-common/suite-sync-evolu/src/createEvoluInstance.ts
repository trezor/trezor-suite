import { AppName, Evolu, type Run, createEvolu, getOrThrow } from '@evolu/common';
import { EvoluPlatformDeps } from '@evolu/common/local-first';

import { SuiteSyncOwner } from '@suite-common/suite-sync-storage';

import { createEvoluAppOwnerFromTrezorData } from './createEvoluAppOwnerFromTrezorData';
import { Schema } from './schema';

// This is a way how to force change of the SQL files. It was useful for development
// so not everybody had to delete SQLite file manually:
// See: https://www.evolu.dev/docs/faq#how-to-delete-opfs-sqlite-in-browser
const VERSION = 8;

type CreateEvoluInstanceFactoryDeps = {
    run: Run<EvoluPlatformDeps>;
};

export type CreateEvoluInstance = (params: {
    suiteSyncOwner: SuiteSyncOwner;
}) => Promise<Evolu<typeof Schema>>;

export type CreateEvoluInstanceDep = {
    createEvoluInstance: CreateEvoluInstance;
};

export const createEvoluInstanceFactory =
    (deps: CreateEvoluInstanceFactoryDeps): CreateEvoluInstance =>
    async ({ suiteSyncOwner }) => {
        const owner = createEvoluAppOwnerFromTrezorData({ data: suiteSyncOwner.ownerSecret });

        if (!owner.ok) {
            console.error(owner.error);

            throw owner.error;
        }

        const appName = AppName.from(`trezor-suite-v${VERSION}`);

        if (!appName.ok) {
            console.error(appName.error);

            throw appName.error;
        }

        return getOrThrow(
            await deps.run(
                createEvolu(Schema, {
                    appName: appName.value,
                    // Intentionally no transport, transport will be passed
                    // later on, so we can change the RelayUrl at any time.
                    transports: [],
                    appOwner: owner.value,
                }),
            ),
        );
    };
