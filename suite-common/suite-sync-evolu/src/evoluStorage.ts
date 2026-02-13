import { Evolu, SyncOwner, createOwnerWebSocketTransport } from '@evolu/common';

import { CreateSuiteStorage, SuiteSyncStorage } from '@suite-common/suite-sync-storage';

import { CreateEvoluInstanceDep } from './createEvoluInstance';
import { AccountTableSchema, EvoluAccountTable } from './data/accountTable';
import { AddressEvoluTable, AddressTableSchema } from './data/addressTable';
import { OutputEvoluTable, OutputTableSchema } from './data/outputTable';
import { EvoluWalletTable, WalletTableSchema } from './data/walletTable';

export type CreateEvoluStorageFactoryDeps = CreateEvoluInstanceDep;

/**
 * This is intended as Wrapper around Evolu. In case we need to change Evolu for
 * something else, this is the Public API for the rest of the Suite ecosystem.
 */
export const createEvoluStorageFactory =
    (deps: CreateEvoluStorageFactoryDeps): CreateSuiteStorage =>
    async ({ suiteSyncOwner }): Promise<SuiteSyncStorage> => {
        /**
         * Dispose function of the connected owner. When owner is changed
         * (for example for RelayUrl change, this needs to be called).
         * @private
         */

        let ownerDispose = () => {};

        const evolu = await deps.createEvoluInstance({
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
            // ownerDispose = evolu.useOwner(syncOwner);
        };

        return {
            data: {
                accounts: new EvoluAccountTable(evolu as unknown as Evolu<typeof AccountTableSchema>),
                wallets: new EvoluWalletTable(evolu as unknown as Evolu<typeof WalletTableSchema>),
                outputs: new OutputEvoluTable(evolu as unknown as Evolu<typeof OutputTableSchema>),
                addresses: new AddressEvoluTable(
                    evolu as unknown as Evolu<typeof AddressTableSchema>,
                ),
            },

            updateRelayUrl,
            dispose: async () => {
                ownerDispose();

                // Todo: reload prevents app from reloading. Evolu has this tab-reload
                //       to clear state as proper dispose is not yet implemented.
                //       However we cannot effort the tab-reload.
                //       See: https://github.com/evoluhq/evolu/issues/614
                // await evolu.resetAppOwner({ reload: false });
                await Promise.resolve();
            },
        };
    };
