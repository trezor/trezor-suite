import { Evolu, SyncOwner, createOwnerWebSocketTransport } from '@evolu/common';

import { CreateSuiteStorage, SuiteSyncStorage } from '@suite-common/suite-sync-storage';

import { CreateEvoluInstanceDep } from './createEvoluInstance';
import { AccountSchema, EvoluAccountTable } from './data/accountTable';
import { AddressEvoluTable, AddressLabelSchema } from './data/addressTable';
import { OutputEvoluTable, OutputLabelSchema } from './data/outputTable';
import { EvoluWalletTable, WalletLabelSchema } from './data/walletTable';

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

        const { evolu, shardOwner } = deps.createEvoluInstance({
            suiteSyncOwnerAppOwner: suiteSyncOwner,
        });

        const updateRelayUrl = async (url: string) => {
            const owner = await evolu.appOwner;

            const appOwner: SyncOwner = {
                id: owner.id,
                encryptionKey: owner.encryptionKey,
                writeKey: owner.writeKey,

                // IMPORTANT: This owner must be AppOwner so all shard owners are synced
                // over the same AppOwner Transport (to share the Quota Limit)
                transports: [createOwnerWebSocketTransport({ url, ownerId: owner.id })],
            };

            ownerDispose();
            // This is here ONLY to update appOwner with transport
            ownerDispose = evolu.useOwner(appOwner);
        };

        updateRelayUrl(relayUrl); // This updates the relay

        return {
            data: {
                accounts: new EvoluAccountTable(
                    evolu as unknown as Evolu<typeof AccountSchema>,
                    shardOwner,
                ),
                wallets: new EvoluWalletTable(
                    evolu as unknown as Evolu<typeof WalletLabelSchema>,
                    shardOwner,
                ),
                outputs: new OutputEvoluTable(
                    evolu as unknown as Evolu<typeof OutputLabelSchema>,
                    shardOwner,
                ),
                addresses: new AddressEvoluTable(
                    evolu as unknown as Evolu<typeof AddressLabelSchema>,
                    shardOwner,
                ),
            },

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
