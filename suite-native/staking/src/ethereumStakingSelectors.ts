import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectAccountStakeTransactions,
    selectDeviceAccounts,
    selectPoolStatsApyData,
    StakeRootState,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getAccountEverstakeStakingPool, isPending } from '@suite-common/wallet-utils';

import { NativeStakingRootState } from './types';

export const selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol | null,
) => {
    const accounts = selectDeviceAccounts(state);

    return accounts.filter(
        account =>
            account.symbol === symbol &&
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
    state: NativeStakingRootState,
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
    const symbol = selectAccountNetworkSymbol(state, accountKey);
    if (!symbol) return null;

    return selectPoolStatsApyData(state, symbol);
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
