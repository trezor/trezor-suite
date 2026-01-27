import { Evolu, EvoluDeps, SimpleName, createEvolu } from '@evolu/common';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex } from '@noble/hashes/utils';

import { SuiteSyncOwner } from '@suite-common/suite-types';

import { createEvoluAppOwnerFromTrezorData } from './createEvoluAppOwnerFromTrezorData';
import { Schema } from './schema';

// This is a way how to force change of the SQL files. It was useful for development
// so not everybody had to delete SQLite file manually:
// See: https://www.evolu.dev/docs/faq#how-to-delete-opfs-sqlite-in-browser
const VERSION = 7;

type CreateEvoluInstanceFactoryDeps = EvoluDeps;

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
        const hashedOwnerId = bytesToHex(sha256(owner.value.id)).slice(0, 16);
        const databaseName = SimpleName.from(`trezor-suite-v${VERSION}-${hashedOwnerId}`);

        if (!databaseName.ok) {
            console.error(databaseName.error);

            throw databaseName.error;
        }

        const evolu = createEvolu(deps)(Schema, {
            name: databaseName.value,
            // Intentionally no transport, transport will be passed
            // later on, so we can change the RelayUrl at any time.
            transports: [],
            externalAppOwner: owner.value,

            // This turns on the Encryption-at-rest (encryption of the SQLLite file),
            encryptionKey: owner.value.encryptionKey,
        });

        evolu.subscribeError(() => {
            const error = evolu.getError();
            console.error(JSON.stringify(error));
        });

        return evolu;
    };
