import { DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { SuiteSyncDataRootState } from '@suite-common/suite-sync';
import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    AccountsRootState,
    FiatRatesRootState,
    TransactionsRootState,
    WalletSettingsRootState,
} from '@suite-common/wallet-core';

export type NativeAccountsRootState = AccountsRootState &
    FiatRatesRootState &
    WalletSettingsRootState &
    DeviceRootState &
    SuiteSyncDataRootState &
    TokenDefinitionsRootState &
    TransactionsRootState;

export const createMemoizedSelector = createWeakMapSelector.withTypes<NativeAccountsRootState>();
