import { Evolu, SyncOwner, createOwnerWebSocketTransport } from '@evolu/common';

import { AccountLabelSchema, AccountLabels } from './labeling/evolu/accountLabels';
import { AddressLabelSchema, AddressLabels } from './labeling/evolu/addressLabels';
import { OutputLabelSchema, OutputLabels } from './labeling/evolu/outputLabels';
import { WalletLabelSchema, WalletLabels } from './labeling/evolu/walletLabels';
import { Schema } from './schema';

/**
 * This is intended as Wrapper around Evolu. In case we need to change Evolu for
 * something else, this is the Public API for the rest of the Suite ecosystem.
 */
export class LocalFirstStorage {
    #evolu: Evolu<typeof Schema>;
    accountLabels: AccountLabels;
    walletLabels: WalletLabels;
    outputLabels: OutputLabels;
    addressLabels: AddressLabels;

    constructor(evolu: Evolu<typeof Schema>) {
        this.#evolu = evolu;
        this.accountLabels = new AccountLabels(
            evolu as unknown as Evolu<typeof AccountLabelSchema>,
        );
        this.walletLabels = new WalletLabels(evolu as unknown as Evolu<typeof WalletLabelSchema>);
        this.outputLabels = new OutputLabels(evolu as unknown as Evolu<typeof OutputLabelSchema>);
        this.addressLabels = new AddressLabels(
            evolu as unknown as Evolu<typeof AddressLabelSchema>,
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

        this.#evolu.useOwner(syncOwner);
    }

    async dispose() {
        // Todo: reload prevets app from reloading. Evolu has this tab-reload
        //       to clear state as proper dispose is not yet implemented.
        //       However we cannot effort the tab-reload.
        //       See: https://github.com/evoluhq/evolu/issues/614
        await this.#evolu.resetAppOwner({ reload: false });
    }
}
