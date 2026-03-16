import { type Evolu, type EvoluDeps, SimpleName, createEvolu } from '@evolu/common';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

import { type SuiteSyncOwner } from '@suite-common/suite-sync-storage';
import { type SuiteSyncErrorHandler } from '@suite-common/suite-sync-types';

import { createEvoluAppOwnerFromTrezorData } from './createEvoluAppOwnerFromTrezorData';
import { createEvoluErrorHandler } from './createEvoluErrorHandler';
import { Schema } from './schema';

// This is a way how to force change of the SQL files. It was useful for development
// so not everybody had to delete SQLite file manually:
// See: https://www.evolu.dev/docs/faq#how-to-delete-opfs-sqlite-in-browser
const VERSION = 8;

type CreateEvoluInstanceFactoryDeps = {
    suiteSyncErrorHandler: SuiteSyncErrorHandler;
    evoluDeps: EvoluDeps;

    // Todo: Temp. Hack: this is only because of concurrency in tests in future versions of Evolu,
    //       this shall be done over evoluDeps. With upgrade of Evolu please check
    //       if this is still needed.
    _evoluDbNameSuffix?: string;
};

export type CreateEvoluInstance = (params: {
    suiteSyncOwner: SuiteSyncOwner;
}) => Evolu<typeof Schema>;

export type CreateEvoluInstanceDep = {
    createEvoluInstance: CreateEvoluInstance;
};

export const createEvoluInstanceFactory =
    (deps: CreateEvoluInstanceFactoryDeps): CreateEvoluInstance =>
    ({ suiteSyncOwner }) => {
        const owner = createEvoluAppOwnerFromTrezorData({ data: suiteSyncOwner.ownerSecret });

        if (!owner.ok) {
            console.error(owner.error);

            throw owner.error;
        }

        // The instance name is used as the SQLite database filename for persistent
        // storage, ensuring that database files are separated and invisible to each
        // other. Hash the ownerId to avoid leaking it into the filename.
        const hashedOwnerId = bytesToHex(sha256(new TextEncoder().encode(owner.value.id))).slice(
            0,
            16,
        );
        const databaseName = SimpleName.from(
            `trezor-suite-v${VERSION}-${hashedOwnerId}${deps._evoluDbNameSuffix ?? ''}`,
        );

        if (!databaseName.ok) {
            console.error(databaseName.error);

            throw databaseName.error;
        }

        const evolu = createEvolu(deps.evoluDeps)(Schema, {
            name: databaseName.value,
            // Intentionally no transport, transport will be passed
            // later on, so we can change the RelayUrl at any time.
            transports: [],
            externalAppOwner: owner.value,

            // This turns on the Encryption-at-rest (encryption of the SQLLite file),
            encryptionKey: owner.value.encryptionKey,
        });

        evolu.subscribeError(createEvoluErrorHandler(evolu, deps.suiteSyncErrorHandler));

        return evolu;
    };
