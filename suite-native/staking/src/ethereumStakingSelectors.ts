import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectAccountStakeTransactions,
    selectDeviceAccounts,
    selectPoolStatsApyData,
    StakeRootState,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getAccountEverstakeStakingPool, isPending } from '@suite-common/wallet-utils';

import { NativeStakingRootState } from './types';

export const selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol = (
    state: NativeStakingRootState,
    networkSymbol: NetworkSymbol | null,
) => {
    const accounts = selectDeviceAccounts(state);

    return accounts.filter(
        account =>
            account.symbol === networkSymbol &&
            account.visible &&
            !!getAccountEverstakeStakingPool(account),
    );
};

export const selectEthereumStakingPoolByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account) return null;

    return getAccountEverstakeStakingPool(account);
};

export const selectEthereumAccountHasStaking = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => !!selectEthereumStakingPoolByAccountKey(state, accountKey);

export const selectEthereumIsStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);
    const isStakePending = Number(stakingPool?.totalPendingStakeBalance ?? 0) > 0;

    return isStakePending;
};

export const selectEthereumIsStakeConfirmingByAccountKey = (
    state: TransactionsRootState,
    accountKey: string,
) => {
    const stakeTxs = selectAccountStakeTransactions(state, accountKey);
    const isStakeConfirming = stakeTxs.some(tx => isPending(tx));

    return isStakeConfirming;
};

export const selectEthereumAPYByAccountKey = (
    state: StakeRootState & AccountsRootState,
    accountKey: string,
) => {
    const networkSymbol = selectAccountNetworkSymbol(state, accountKey);
    if (!networkSymbol) return null;

    return selectPoolStatsApyData(state, networkSymbol);
};

export const selectEthereumStakedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.depositedBalance ?? '0';
};

export const selectEthereumRewardsBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.restakedReward ?? '0';
};

export const selectEthereumTotalStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.totalPendingStakeBalance ?? '0';
};
