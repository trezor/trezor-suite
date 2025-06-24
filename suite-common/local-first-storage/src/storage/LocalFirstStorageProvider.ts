import { EvoluDeps, Mnemonic, SimpleName, createEvolu } from '@evolu/common';

import { EvoluKeys } from '@suite-common/wallet-core';

import { deriveMnemonic } from '../deriveMnemonic';
import { Schema } from '../schema';
import { LocalFirstStorage } from '../storage';
import { toNanoId } from '../toNanoId';

// This is a way how to force change of the SQL files.
// This shall NEVER change in production!!!
const VERSION = 2;

type CreateEvoluInstanceProps = {
    relayUrl: string;
    evoluKeys: EvoluKeys;
    evoluDeps: EvoluDeps;
};

const createEvoluInstance = ({ relayUrl, evoluKeys, evoluDeps }: CreateEvoluInstanceProps) => {
    // Todo: replace this once https://github.com/evoluhq/evolu/issues/537 is implemented

    const name = SimpleName.from(`trezor-suite-v${VERSION}-${toNanoId(evoluKeys.ownerId)}`);
    if (!name.ok) {
        console.error(name.error);

        throw name.error;
    }

    const evoluMnemonic = Mnemonic.from(deriveMnemonic(evoluKeys.writeKey));
    if (!evoluMnemonic.ok) {
        console.error(evoluMnemonic.error);

        throw evoluMnemonic.error;
    }

    console.log('____createEvoluInstance', evoluMnemonic.value, relayUrl);

    const evolu = createEvolu(evoluDeps)(Schema, {
        name: name.value,
        syncUrl: relayUrl,
        mnemonic: evoluMnemonic.value,
    });

    // Todo: remove this for production
    evolu.subscribeError(() => {
        const error = evolu.getError();

        console.log(error);

        if (!error) return;
        // alert('🚨 Evolu error occurred! Check the console.');

        console.error(JSON.stringify(error));
    });

    return evolu;
};

type OwnerId = string;

export const DEFAULT_LOCAL_FIRST_STORAGE_RELAY_URL = 'https://free.evoluhq.com';

export class LocalFirstStorageProvider {
    private storages = new Map<OwnerId, LocalFirstStorage>();

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

    /**
     * @deprecated Debug only!
     */
    _reset = async () => {
        for (const storage of this.storages.values()) {
            await storage._resetAppOwner();
        }
    };
}
