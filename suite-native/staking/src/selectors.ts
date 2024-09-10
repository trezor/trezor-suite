import {
    StakeRootState,
    AccountsRootState,
    selectAccountByKey,
    selectAccountNetworkSymbol,
    selectAccountStakeTransactions,
    selectPoolStatsApyData,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { getAccountEverstakeStakingPool, isPending } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const getStakingPoolByAccountKey = (state: AccountsRootState, accountKey: string) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account) return null;

    return getAccountEverstakeStakingPool(account);
};

export const getIsStakePendingByAccountKey = (state: AccountsRootState, accountKey: string) => {
    const stakingPool = getStakingPoolByAccountKey(state, accountKey);
    const isStakePending = new BigNumber(stakingPool?.totalPendingStakeBalance ?? '0').gt(0);

    return isStakePending;
};

export const getIsStakeConfirmingByAccountKey = (
    state: TransactionsRootState,
    accountKey: string,
) => {
    const stakeTxs = selectAccountStakeTransactions(state, accountKey);
    const isStakeConfirming = stakeTxs.some(tx => isPending(tx));

    return isStakeConfirming;
};

export const getAPYByAccountKey = (
    state: StakeRootState & AccountsRootState,
    accountKey: string,
) => {
    const networkSymbol = selectAccountNetworkSymbol(state, accountKey);
    if (!networkSymbol) return null;

    return selectPoolStatsApyData(state, networkSymbol);
};

export const getStakedBalanceByAccountKey = (state: AccountsRootState, accountKey: string) => {
    const stakingPool = getStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.depositedBalance ?? '0';
};

export const getRewardsBalanceByAccountKey = (state: AccountsRootState, accountKey: string) => {
    const stakingPool = getStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.restakedReward ?? '0';
};

export const getTotalStakePendingByAccountKey = (state: AccountsRootState, accountKey: string) => {
    const stakingPool = getStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.totalPendingStakeBalance ?? '0';
};
