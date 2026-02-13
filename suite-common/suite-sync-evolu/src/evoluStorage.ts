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

        const evolu = await deps.createEvoluInstance({
            suiteSyncOwner,
        });

        const updateRelayUrl = async (url: string) => {
            const owner = await evolu.appOwner;

            unuseOwner();
            unuseOwner = evolu.useOwner(owner, [
                createOwnerWebSocketTransport({ url, ownerId: owner.id }),
            ]);
        };

        return {
            data: {
                accounts: new EvoluAccountTable(
                    evolu as unknown as Evolu<typeof AccountTableSchema>,
                ),
                wallets: new EvoluWalletTable(evolu as unknown as Evolu<typeof WalletTableSchema>),
                outputs: new OutputEvoluTable(evolu as unknown as Evolu<typeof OutputTableSchema>),
                addresses: new AddressEvoluTable(
                    evolu as unknown as Evolu<typeof AddressTableSchema>,
                ),
            },

            updateRelayUrl,
            dispose: async () => {
                unuseOwner();
                evolu[Symbol.asyncDispose]();
                await Promise.resolve();
            },
        };
    };
