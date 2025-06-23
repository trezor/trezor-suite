import { EvoluDeps, Mnemonic, SimpleName, createEvolu, getOrThrow } from '@evolu/common';

import { deriveMnemonic } from '../deriveMnemonic';
import { Schema } from '../schema';
import { LocalFirstStorage } from '../storage';
import { toNanoId } from '../toNanoId';

type CreateEvoluInstanceProps = {
    relayUrl: string;
    secret: string;
    evoluDeps: EvoluDeps;
};

const createEvoluInstance = ({ relayUrl, secret, evoluDeps }: CreateEvoluInstanceProps) => {
    const evoluMnemonic = getOrThrow(Mnemonic.from(deriveMnemonic(secret)));

    console.log('____createEvoluInstance', secret, evoluMnemonic);

    const walletNanoId = toNanoId(secret);

    const evolu = createEvolu(evoluDeps)(Schema, {
        name: getOrThrow(SimpleName.from(`trezor-suite-${walletNanoId}`)),
        syncUrl: relayUrl,
        mnemonic: evoluMnemonic,
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

type DeviceSecret = string;

export class LocalFirstStorageProvider {
    private storages = new Map<DeviceSecret, LocalFirstStorage>();

    constructor(
        private relayUrl: string,
        private evoluDeps: EvoluDeps,
    ) {}

    getStorage(secret: DeviceSecret) {
        let storage = this.storages.get(secret);

        if (storage === undefined) {
            const evolu = createEvoluInstance({
                relayUrl: this.relayUrl,
                secret,
                evoluDeps: this.evoluDeps,
            });
            storage = new LocalFirstStorage(evolu);
            this.storages.set(secret, storage);
        }

        return storage;
    }

    deleteStorage(secret: string) {
        // Evolu does not support proper disconnect and disposal yet. This is a workaround.
        // this.storages.get(secret)?._resetAppOwner();

        this.storages.delete(secret);
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
