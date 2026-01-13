import {
    AccountTable,
    AddressTable,
    InferSuiteSyncTableEntity,
    OutputTable,
    SuiteSyncStorage,
    SuiteSyncTable,
    WalletTable,
} from '@suite-common/suite-sync-storage';

import { createMockDeps, mockNotExpected } from './utils';

const createSuiteSyncTableMock = <T extends SuiteSyncTable<any>>(methods?: Partial<T>) =>
    createMockDeps<SuiteSyncTable<InferSuiteSyncTableEntity<T>>>({
        subscribe: methods?.subscribe ?? mockNotExpected('subscribe'),
        update: methods?.update ?? mockNotExpected('update'),
    });

type CreateSuiteSyncStorageMockParams = {
    wallets?: Partial<WalletTable>;
    accounts?: Partial<AccountTable>;
    addresses?: Partial<AddressTable>;
    outputs?: Partial<OutputTable>;
    updateRelayUrl?: SuiteSyncStorage['updateRelayUrl'];
    dispose?: SuiteSyncStorage['dispose'];
};

export const createSuiteSyncStorageMock = (params: CreateSuiteSyncStorageMockParams = {}) =>
    ({
        data: {
            wallets: createSuiteSyncTableMock<WalletTable>(params.wallets),
            accounts: createSuiteSyncTableMock<AccountTable>(params.accounts),
            addresses: createSuiteSyncTableMock<AddressTable>(params.addresses),
            outputs: createSuiteSyncTableMock<OutputTable>(params.outputs),
        },
        dispose: params.dispose ?? mockNotExpected('dispose'),
        updateRelayUrl: params.updateRelayUrl ?? mockNotExpected('updateRelayUrl'),
    }) satisfies SuiteSyncStorage;
