import { Evolu, EvoluDeps, SyncOwner, createOwnerWebSocketTransport } from '@evolu/common';

import { EvoluKeys } from '@suite-common/suite-types';

import { AccountLabelSchema, AccountLabels } from './labeling/evolu/accountLabels';
import { AddressLabelSchema, AddressLabels } from './labeling/evolu/addressLabels';
import { OutputLabelSchema, OutputLabels } from './labeling/evolu/outputLabels';
import { WalletLabelSchema, WalletLabels } from './labeling/evolu/walletLabels';
import { Schema } from './schema';
import { createEvoluInstance } from './storage/createEvoluInstance';

type LocalFirstStorageDeps = {
    relayUrl: string;
    evoluKeys: EvoluKeys;
    evoluDeps: EvoluDeps;
};

/**
 * This is intended as Wrapper around Evolu. In case we need to change Evolu for
 * something else, this is the Public API for the rest of the Suite ecosystem.
 */
export class LocalFirstStorage {
    /**
     * Dispose function of the connected owner. When owner is changed
     * (for example for RelayUrl change, this needs to be called).
     * @private
     */
    #ownerDispose: () => void;

    #evolu: Evolu<typeof Schema>;
    accountLabels: AccountLabels;
    walletLabels: WalletLabels;
    outputLabels: OutputLabels;
    addressLabels: AddressLabels;

    constructor({ relayUrl, evoluDeps, evoluKeys }: LocalFirstStorageDeps) {
        // just to satisfy TS for initialization,
        // its then truly initialized in this.updateRelayUrl()
        this.#ownerDispose = () => {};

        this.#evolu = createEvoluInstance({
            evoluKeys,
            evoluDeps,
        });
        this.updateRelayUrl(relayUrl); // This updates the relay

        this.accountLabels = new AccountLabels(
            this.#evolu as unknown as Evolu<typeof AccountLabelSchema>,
        );
        this.walletLabels = new WalletLabels(
            this.#evolu as unknown as Evolu<typeof WalletLabelSchema>,
        );
        this.outputLabels = new OutputLabels(
            this.#evolu as unknown as Evolu<typeof OutputLabelSchema>,
        );
        this.addressLabels = new AddressLabels(
            this.#evolu as unknown as Evolu<typeof AddressLabelSchema>,
        );
    }

    async updateRelayUrl(url: string) {
        const owner = await this.#evolu.appOwner;

        const syncOwner: SyncOwner = {
            id: owner.id,
            encryptionKey: owner.encryptionKey,
            writeKey: owner.writeKey,
            transports: [createOwnerWebSocketTransport({ url, ownerId: owner.id })],
        };

        this.#ownerDispose();
        this.#ownerDispose = this.#evolu.useOwner(syncOwner);
    }

    async dispose() {
        this.#ownerDispose();
        // Todo: reload prevets app from reloading. Evolu has this tab-reload
        //       to clear state as proper dispose is not yet implemented.
        //       However we cannot effort the tab-reload.
        //       See: https://github.com/evoluhq/evolu/issues/614
        await this.#evolu.resetAppOwner({ reload: false });
    }
}
