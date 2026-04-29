import type { WalletDescriptor } from '@suite-common/wallet-types';

import type { SparkState } from './sparkFeatureReducer';
import { createSparkWalletKey } from '../accounts/sparkAccounts';

export type SparkRootState = {
    spark: SparkState;
};

export const selectSpark = (state: SparkRootState) => state.spark;

export const selectIsSparkEnabled = (state: SparkRootState) => state.spark.isEnabled;

export const selectSparkAccountsByWalletDescriptor = (
    state: SparkRootState,
    walletDescriptor: WalletDescriptor,
) => state.spark.accountsByWalletDescriptor[walletDescriptor] ?? [];

export const selectSelectedSparkAccountNumber = (
    state: SparkRootState,
    walletDescriptor: WalletDescriptor,
) => state.spark.selectedAccountNumberByWalletDescriptor[walletDescriptor];

export const selectSelectedSparkAccount = (
    state: SparkRootState,
    walletDescriptor: WalletDescriptor,
) => {
    const selectedAccountNumber = selectSelectedSparkAccountNumber(state, walletDescriptor);

    if (selectedAccountNumber === undefined) {
        return undefined;
    }

    return selectSparkAccountsByWalletDescriptor(state, walletDescriptor).find(
        account => account.accountNumber === selectedAccountNumber,
    );
};

export const selectSparkWalletByAccountNumber = (
    state: SparkRootState,
    params: {
        accountNumber: number;
        walletDescriptor: WalletDescriptor;
    },
) => state.spark.walletsByKey[createSparkWalletKey(params)];
