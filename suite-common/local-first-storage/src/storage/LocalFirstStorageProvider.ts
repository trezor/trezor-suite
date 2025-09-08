import {
    EncryptionKey,
    EvoluDeps,
    OwnerId,
    SimpleName,
    WriteKey,
    createEvolu,
    createIdFromString,
    getOrThrow,
    hexToBytes,
} from '@evolu/common';

import { EvoluKeys } from '@suite-common/suite-types';

import { Schema } from '../schema';
import { LocalFirstStorage } from '../storage';

// This is a way how to force change of the SQL files.
// This shall NEVER change in production!!!
const VERSION = 2;

type CreateEvoluInstanceProps = {
    relayUrl: string;
    evoluKeys: EvoluKeys;
    evoluDeps: EvoluDeps;
};

const createEvoluInstance = ({ relayUrl, evoluKeys, evoluDeps }: CreateEvoluInstanceProps) => {
    const evoluOwnerId = getOrThrow(OwnerId.from(createIdFromString(evoluKeys.ownerId)));

    const sanitizedOwnerId = evoluOwnerId.replace('_', '-');
    const databaseName = SimpleName.from(`trezor-suite-v${VERSION}-${sanitizedOwnerId}`);

    if (!databaseName.ok) {
        console.error(databaseName.error);

        throw databaseName.error;
    }

    const evolu = createEvolu(evoluDeps)(Schema, {
        name: databaseName.value,
        syncUrl: relayUrl,
        initialAppOwner: {
            type: 'AppOwner',
            id: evoluOwnerId,
            encryptionKey: getOrThrow(EncryptionKey.from(hexToBytes(evoluKeys.encryptionKey))),
            writeKey: getOrThrow(
                WriteKey.from(
                    // Evolu uses only the first 16 bytes as write key
                    hexToBytes(evoluKeys.writeKey).slice(0, 16),
                ),
            ),
        },
    });

    evolu.subscribeError(() => {
        const error = evolu.getError();
        console.error(JSON.stringify(error));
    });

    return evolu;
};

type SuiteOwnerId = string;

// The `https://evolu.suite.sldev.cz/evolu/` MUST have the last `/` in the URL.
export const DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL = 'https://evolu.suite.sldev.cz/evolu/';

export class LocalFirstStorageProvider {
    private storages = new Map<SuiteOwnerId, LocalFirstStorage>();

    constructor(
        private relayUrl: string | null, // null -> fallback to default
        private evoluDeps: EvoluDeps,
    ) {}

    getStorage(evoluKeys: EvoluKeys) {
        let storage = this.storages.get(evoluKeys.ownerId);

        if (storage === undefined) {
            const evolu = createEvoluInstance({
                relayUrl: this.relayUrl ?? DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL,
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
