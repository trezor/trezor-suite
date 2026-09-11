import { type Evolu, createOwnerWebSocketTransport } from '@evolu/common';

import { type CreateSuiteStorage, type SuiteSyncStorage } from '@suite-common/suite-sync-storage';

import { type EvoluInstanceFactoryDep } from './createEvoluInstance';
import { type AccountTableSchema, EvoluAccountTable } from './data/accountTable';
import { AddressEvoluTable, type AddressTableSchema } from './data/addressTable';
import { OutputEvoluTable, type OutputTableSchema } from './data/outputTable';
import { EvoluWalletTable, type WalletTableSchema } from './data/walletTable';

export type CreateEvoluStorageFactoryDeps = EvoluInstanceFactoryDep;

export type EvoluStorageFactory = CreateSuiteStorage;

/**
 * This is intended as Wrapper around Evolu. In case we need to change Evolu for
 * something else, this is the Public API for the rest of the Suite ecosystem.
 */
export const createEvoluStorageFactory =
    (deps: CreateEvoluStorageFactoryDeps): EvoluStorageFactory =>
    async ({ suiteSyncOwner }): Promise<SuiteSyncStorage> => {
        const evolu = await deps.evoluInstanceFactory({ suiteSyncOwner });
        const owner = await evolu.appOwner;
        let relayUrl: string | null = null;
        let unuseOwner = () => {};

        const disconnectRelay = () => {
            unuseOwner();
            unuseOwner = () => {};
            relayUrl = null;

            return Promise.resolve();
        };

        const forceResync = () => {
            if (relayUrl !== null) {
                // Resubscribing starts full reconciliation, including previously rejected writes.
                unuseOwner();
                unuseOwner = evolu.useOwner(owner, [
                    createOwnerWebSocketTransport({ url: relayUrl, ownerId: owner.id }),
                ]);
            }

            return Promise.resolve();
        };

        const updateRelayUrl = (url: string) => {
            relayUrl = url;

            return forceResync();
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
            forceResync,
            disconnectRelay,
            dispose: async () => {
                await disconnectRelay();
                await evolu[Symbol.asyncDispose]();
            },
        };
    };
