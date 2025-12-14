import { SuiteSyncOwner } from '@suite-common/suite-types/';

import { AccountTable } from './data/AccountTable';
import { AddressTable } from './data/AddressTable';
import { OutputTable } from './data/OutputTable';
import { WalletTable } from './data/WalletTable';

/**
 * This is a **Stateful** service, that represents a Store for one Owner (for example Wallet).
 * Every wallet has its own Store. Store can use different technologies to provide Synchronization
 * of data. For example the Evolu library.
 */
export type SuiteSyncStorage = {
    accounts: AccountTable;
    wallets: WalletTable;
    outputs: OutputTable;
    addresses: AddressTable;

    updateRelayUrl(url: string): Promise<void>;
    dispose(): Promise<void>;
};

type SuiteStorageCreatorParams = {
    suiteSyncOwner: SuiteSyncOwner;
    relayUrl: string;
};

/**
 * This is a service responsible for creating the SuiteSyncStorage. Every Owner
 * has its own Storage. Currently only Evolu storage is implemented, but in theory,
 * you can have different one as well.
 */
export type CreateSuiteStorage = (params: SuiteStorageCreatorParams) => SuiteSyncStorage;

export type CreateSuiteStorageDep = {
    createSuiteStorage: CreateSuiteStorage;
};
