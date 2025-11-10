import {
    EvoluDeps,
    OwnerId,
    SimpleName,
    createEvolu,
    createOwnerWebSocketTransport,
} from '@evolu/common';

import { EvoluKeys } from '@suite-common/suite-types';
import { isDevEnv } from '@suite-common/suite-utils';

import { createEvoluAppOwnerFromTrezorData } from '../createEvoluAppOwnerFromTrezorData';
import { Schema } from '../schema';
import { LocalFirstStorage } from '../storage';

// This is a way how to force change of the SQL files. It was useful for development
// so not everybody had to delete SQLite file manually:
// See: https://www.evolu.dev/docs/faq#how-to-delete-opfs-sqlite-in-browser
const VERSION = 3;

type CreateEvoluInstanceProps = {
    relayUrl: string;
    evoluKeys: EvoluKeys;
    evoluDeps: EvoluDeps;
};

const createEvoluInstance = ({ relayUrl, evoluKeys, evoluDeps }: CreateEvoluInstanceProps) => {
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
        transports: [createOwnerWebSocketTransport({ url: relayUrl, ownerId: owner.value.id })],
        externalAppOwner: owner.value,
    });

    evolu.subscribeError(() => {
        const error = evolu.getError();
        console.error(JSON.stringify(error));
    });

    return evolu;
};

type SuiteOwnerId = string;

// The `https://suite-sync.trezor.io/` MUST have the last `/` in the URL.
export const DEFAULT_SUITE_SYNC_RELAY_URL = isDevEnv
    ? 'https://evolu.suite.sldev.cz/evolu/'
    : 'https://suite-sync.trezor.io/';

export class LocalFirstStorageProvider {
    private storages = new Map<SuiteOwnerId, LocalFirstStorage>();

    constructor(
        private relayUrl: string | null, // null -> fallback to default
        private evoluDeps: EvoluDeps,
    ) {}

    getStorage(evoluKeys: EvoluKeys) {
        let storage = this.storages.get(evoluKeys.ownerId);

        if (storage === undefined) {
            const relayUrl =
                this.relayUrl === null || this.relayUrl.trim() === ''
                    ? DEFAULT_SUITE_SYNC_RELAY_URL
                    : this.relayUrl;

            const evolu = createEvoluInstance({
                relayUrl,
                evoluKeys,
                evoluDeps: this.evoluDeps,
            });

            storage = new LocalFirstStorage(evolu);
            this.storages.set(evoluKeys.ownerId, storage);
        }

        return storage;
    }

    deleteStorage(ownerId: OwnerId) {
        // Evolu does not support proper disconnect and disposal yet. This is a workaround.
        // this.storages.get(secret)?._resetAppOwner();

        this.storages.delete(ownerId);
    }
}
