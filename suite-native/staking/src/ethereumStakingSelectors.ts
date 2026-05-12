import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { getDaysToAddToPool, getDaysToAddToPoolInitial } from '@suite-common/staking';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectAccountStakeTransactions,
    selectDeviceAccounts,
    selectEthValidatorsQueue,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    getAccountEverstakeStakingPool,
    getUnstakingPeriodInDays,
    isPending,
} from '@suite-common/wallet-utils';

import { type NativeStakingRootState } from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeStakingRootState>();
const createAccountsMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

export const selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol = createMemoizedSelector(
    [selectDeviceAccounts, (_state, symbol: NetworkSymbol | null) => symbol],
    (accounts, symbol) =>
        returnStableArrayIfEmpty(
            accounts.filter(
                account =>
                    account.symbol === symbol &&
                    account.visible &&
                    !!getAccountEverstakeStakingPool(account),
            ),
        ),
);

export const selectEthereumStakingPoolByAccountKey = createAccountsMemoizedSelector(
    [selectAccountByKey],
    account => (account ? getAccountEverstakeStakingPool(account) : null),
);

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

export const selectUnstakingPeriodInDaysBySymbol = (
    state: NativeStakingRootState,
    symbol: NetworkSymbol | undefined,
) => {
    const validatorsQueue = selectEthValidatorsQueue(state);

    return getUnstakingPeriodInDays(symbol ? getNetworkType(symbol) : undefined, validatorsQueue);
};

export const selectEntryPeriodInDaysBySymbol = (state: NativeStakingRootState) => {
    const validatorsQueue = selectEthValidatorsQueue(state);

    if (
        validatorsQueue?.activationTime === undefined ||
        validatorsQueue?.addingDelay === undefined
    ) {
        return undefined;
    }

    return getDaysToAddToPoolInitial(validatorsQueue);
};

export const selectEntryPeriodRemainingInDaysByAccountKey = (
    state: NativeStakingRootState,
    accountKey: AccountKey,
) => {
    const validatorsQueue = selectEthValidatorsQueue(state);
    const stakeTxs = selectAccountStakeTransactions(state, accountKey);

    return getDaysToAddToPool(stakeTxs, validatorsQueue);
};
