import { EvoluDeps, SimpleName, createEvolu } from '@evolu/common';

import { EvoluKeys } from '@suite-common/suite-types';

import { createEvoluAppOwnerFromTrezorData } from '../createEvoluAppOwnerFromTrezorData';
import { Schema } from '../schema';

// This is a way how to force change of the SQL files. It was useful for development
// so not everybody had to delete SQLite file manually:
// See: https://www.evolu.dev/docs/faq#how-to-delete-opfs-sqlite-in-browser
const VERSION = 5;

type CreateEvoluInstanceProps = {
    evoluKeys: EvoluKeys;
    evoluDeps: EvoluDeps;
};

export const createEvoluInstance = ({ evoluKeys, evoluDeps }: CreateEvoluInstanceProps) => {
    const owner = createEvoluAppOwnerFromTrezorData({ data: evoluKeys.ownerSecret });

    if (!owner.ok) {
        console.error(owner.error);

        throw owner.error;
    }

    const sanitizedOwnerId = owner.value.id.replaceAll('_', '-');
    const databaseName = SimpleName.from(`trezor-suite-v${VERSION}-${sanitizedOwnerId}`);

    if (!databaseName.ok) {
        console.error(databaseName.error);

        throw databaseName.error;
    }

    const evolu = createEvolu(evoluDeps)(Schema, {
        name: databaseName.value,
        // Intentionally no transport, transport will be passed
        // later on, so we can change the RelayUrl at any time.
        transports: [],
        externalAppOwner: owner.value,
    });

    evolu.subscribeError(() => {
        const error = evolu.getError();
        console.error(JSON.stringify(error));
    });

    return evolu;
};
