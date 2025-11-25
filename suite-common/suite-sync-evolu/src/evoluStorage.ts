import { Evolu, SyncOwner, createOwnerWebSocketTransport } from '@evolu/common';

import { CreateSuiteStorage, SuiteSyncStorage } from '@suite-common/suite-sync-storage';

import { CreateEvoluInstanceDep } from './createEvoluInstance';
import { AccountLabelSchema, AccountLabels } from './labeling/accountLabels';
import { AddressLabelSchema, AddressLabels } from './labeling/addressLabels';
import { OutputLabelSchema, OutputLabels } from './labeling/outputLabels';
import { WalletLabelSchema, WalletLabels } from './labeling/walletLabels';

export type CreateEvoluStorageFactoryDeps = CreateEvoluInstanceDep;

/**
 * This is intended as Wrapper around Evolu. In case we need to change Evolu for
 * something else, this is the Public API for the rest of the Suite ecosystem.
 */
export const createEvoluStorageFactory =
    (deps: CreateEvoluStorageFactoryDeps): CreateSuiteStorage =>
    ({ suiteSyncOwner, relayUrl }): SuiteSyncStorage => {
        /**
         * Dispose function of the connected owner. When owner is changed
         * (for example for RelayUrl change, this needs to be called).
         * @private
         */

        let ownerDispose = () => {};

        const evolu = deps.createEvoluInstance({
            suiteSyncOwner,
        });

        const updateRelayUrl = async (url: string) => {
            const owner = await evolu.appOwner;

            const syncOwner: SyncOwner = {
                id: owner.id,
                encryptionKey: owner.encryptionKey,
                writeKey: owner.writeKey,
                transports: [createOwnerWebSocketTransport({ url, ownerId: owner.id })],
            };

            ownerDispose();
            ownerDispose = evolu.useOwner(syncOwner);
        };

        updateRelayUrl(relayUrl); // This updates the relay

        return {
            accountLabels: new AccountLabels(evolu as unknown as Evolu<typeof AccountLabelSchema>),
            walletLabels: new WalletLabels(evolu as unknown as Evolu<typeof WalletLabelSchema>),
            outputLabels: new OutputLabels(evolu as unknown as Evolu<typeof OutputLabelSchema>),
            addressLabels: new AddressLabels(evolu as unknown as Evolu<typeof AddressLabelSchema>),

            updateRelayUrl,
            dispose: async () => {
                ownerDispose();
                // Todo: reload prevets app from reloading. Evolu has this tab-reload
                //       to clear state as proper dispose is not yet implemented.
                //       However we cannot effort the tab-reload.
                //       See: https://github.com/evoluhq/evolu/issues/614
                await evolu.resetAppOwner({ reload: false });
            },
        };
    };
