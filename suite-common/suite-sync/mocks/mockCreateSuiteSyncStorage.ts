import { createMockDeps, mockNotExpected } from '@suite-common/dependency-injection';
import {
    AccountTable,
    AddressTable,
    InferSuiteSyncTableEntity,
    OutputTable,
    SuiteSyncStorage,
    SuiteSyncTable,
    WalletTable,
} from '@suite-common/suite-sync-storage';

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
    disconnectRelay?: SuiteSyncStorage['disconnectRelay'];
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
        disconnectRelay: params.disconnectRelay ?? mockNotExpected('disconnectRelay'),
        dispose: params.dispose ?? mockNotExpected('dispose'),
        updateRelayUrl: params.updateRelayUrl ?? mockNotExpected('updateRelayUrl'),
    }) satisfies SuiteSyncStorage;
