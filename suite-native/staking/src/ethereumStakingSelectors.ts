import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectAccountStakeTransactions,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getAccountEverstakeStakingPool, isPending } from '@suite-common/wallet-utils';

import { type NativeStakingRootState } from './types';

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
    accountKey: AccountKey,
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
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);
    const isStakePending = Number(stakingPool?.totalPendingStakeBalance ?? 0) > 0;

    return isStakePending;
};

export const selectEthereumIsStakeConfirmingByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const stakeTxs = selectAccountStakeTransactions(state, accountKey);
    const isStakeConfirming = stakeTxs.some(tx => isPending(tx));

    return isStakeConfirming;
};

export const selectEthereumStakedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.depositedBalance ?? '0';
};

export const selectEthereumRewardsBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.restakedReward ?? '0';
};

export const selectEthereumTotalStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.totalPendingStakeBalance ?? '0';
};

export const selectEthereumClaimableAmountByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.claimableAmount ?? '0';
};

export const selectEthereumCanClaimByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.canClaim ?? false;
};

export const selectEthereumUnstakingBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.withdrawTotalAmount ?? '0';
};

export const selectEthereumPendingDepositedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);

    return stakingPool?.pendingDepositedBalance ?? '0';
};
