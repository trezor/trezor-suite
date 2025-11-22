import { EvoluDeps, OwnerId } from '@evolu/common';

import { EvoluKeys } from '@suite-common/suite-types';
import { isDevEnv } from '@suite-common/suite-utils';

import { LocalFirstStorage } from '../storage';

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

    getStorage(evoluKeys: EvoluKeys): LocalFirstStorage {
        let storage = this.storages.get(evoluKeys.ownerId);

        if (storage === undefined) {
            const relayUrl =
                this.relayUrl === null || this.relayUrl.trim() === ''
                    ? DEFAULT_SUITE_SYNC_RELAY_URL
                    : this.relayUrl;

            storage = new LocalFirstStorage({
                relayUrl,
                evoluDeps: this.evoluDeps,
                evoluKeys,
            });
            this.storages.set(evoluKeys.ownerId, storage);
        }

        return storage;
    }

    async deleteStorage(ownerId: OwnerId) {
        await this.storages.get(ownerId)?.dispose();
        this.storages.delete(ownerId);
    }
}
