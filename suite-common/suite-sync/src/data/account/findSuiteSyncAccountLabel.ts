import { type NetworkSymbol } from '@suite-common/networks';
import { type SuiteSyncAccount } from '@suite-common/suite-sync-storage';
import { type AccountDescriptor } from '@suite-common/wallet-types';

export const findSuiteSyncAccountLabel = (params: {
    accounts: SuiteSyncAccount[];
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
}) =>
    params.accounts.find(
        account =>
            account.accountDescriptor === params.accountDescriptor &&
            account.networkSymbol === params.networkSymbol,
    );
