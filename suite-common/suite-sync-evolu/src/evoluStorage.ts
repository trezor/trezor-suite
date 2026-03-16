import { type Evolu, type SyncOwner, createOwnerWebSocketTransport } from '@evolu/common';

import { type CreateSuiteStorage, type SuiteSyncStorage } from '@suite-common/suite-sync-storage';

import { type CreateEvoluInstanceDep } from './createEvoluInstance';
import { type AccountSchema, EvoluAccountTable } from './data/accountTable';
import { AddressEvoluTable, type AddressLabelSchema } from './data/addressTable';
import { OutputEvoluTable, type OutputLabelSchema } from './data/outputTable';
import { EvoluWalletTable, type WalletLabelSchema } from './data/walletTable';

export type CreateEvoluStorageFactoryDeps = CreateEvoluInstanceDep;

/**
 * This is intended as Wrapper around Evolu. In case we need to change Evolu for
 * something else, this is the Public API for the rest of the Suite ecosystem.
 */
export const createEvoluStorageFactory =
    (deps: CreateEvoluStorageFactoryDeps): CreateSuiteStorage =>
    ({ suiteSyncOwner }): SuiteSyncStorage => {
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

        return {
            data: {
                accounts: new EvoluAccountTable(evolu as unknown as Evolu<typeof AccountSchema>),
                wallets: new EvoluWalletTable(evolu as unknown as Evolu<typeof WalletLabelSchema>),
                outputs: new OutputEvoluTable(evolu as unknown as Evolu<typeof OutputLabelSchema>),
                addresses: new AddressEvoluTable(
                    evolu as unknown as Evolu<typeof AddressLabelSchema>,
                ),
            },

            updateRelayUrl,
            dispose: async () => {
                ownerDispose();
                // Todo: reload prevents app from reloading. Evolu has this tab-reload
                //       to clear state as proper dispose is not yet implemented.
                //       However we cannot effort the tab-reload.
                //       See: https://github.com/evoluhq/evolu/issues/614
                await evolu.resetAppOwner({ reload: false });
            },
        };
    };
