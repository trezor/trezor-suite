import { type Evolu, createOwnerWebSocketTransport } from '@evolu/common';

import { type CreateSuiteStorage, type SuiteSyncStorage } from '@suite-common/suite-sync-storage';

import { type CreateEvoluInstanceDep } from './createEvoluInstance';
import { type AccountTableSchema, EvoluAccountTable } from './data/accountTable';
import { AddressEvoluTable, type AddressTableSchema } from './data/addressTable';
import { OutputEvoluTable, type OutputTableSchema } from './data/outputTable';
import { EvoluWalletTable, type WalletTableSchema } from './data/walletTable';

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

        let unuseOwner = () => {};

        const { evolu, shardOwner } = await deps.createEvoluInstance({
            suiteSyncOwner,
        });

        const updateRelayUrl = async (url: string) => {
            const appOwner = await evolu.appOwner;

            unuseOwner();
            unuseOwner = evolu.useOwner(appOwner, [
                createOwnerWebSocketTransport({ url, ownerId: appOwner.id }),
            ]);
        };

        return {
            data: {
                accounts: new EvoluAccountTable(
                    evolu as unknown as Evolu<typeof AccountTableSchema>,
                    shardOwner,
                ),
                wallets: new EvoluWalletTable(
                    evolu as unknown as Evolu<typeof WalletTableSchema>,
                    shardOwner,
                ),
                outputs: new OutputEvoluTable(
                    evolu as unknown as Evolu<typeof OutputTableSchema>,
                    shardOwner,
                ),
                addresses: new AddressEvoluTable(
                    evolu as unknown as Evolu<typeof AddressTableSchema>,
                    shardOwner,
                ),
            },

            updateRelayUrl,
            dispose: async () => {
                await evolu[Symbol.asyncDispose]();
            },
        };
    };
