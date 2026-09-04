import { type NetworkSymbol } from '@suite-common/networks';
import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    getAccountEverstakeStakingPool,
    isPending,
    secondsToDays,
} from '@suite-common/wallet-utils';

import { getDaysToAddToPoolInitial } from './ethereumStaking';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey, selectDeviceAccounts } from '../../accounts/accountsSelectors';
import { selectAccountStakeTransactions } from '../../transactions/transactionsSelectors';
import { getUnstakingPeriodInDays } from '../shared/stakingUtils';
import { type StakeRootState } from '../stakingReducerTypes';
import { selectStakeData } from '../stakingSelectors';

export const selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol = (
    state: StakeRootState,
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

export const selectEthereumAccountHasStaking = (state: StakeRootState, accountKey: AccountKey) =>
    !!selectEthereumStakingPoolByAccountKey(state, accountKey);

export const selectEthereumIsStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const stakingPool = selectEthereumStakingPoolByAccountKey(state, accountKey);
    const isStakePending = Number(stakingPool?.totalPendingStakeBalance ?? 0) > 0;

    return isStakePending;
};

export const selectEthereumIsStakeConfirmingByAccountKey = (
    state: StakeRootState,
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

export const selectEthereumValidatorsQueue = (state: StakeRootState) =>
    selectStakeData(state).eth?.validators;

export const selectUnstakingPeriodInDaysBySymbol = (
    state: StakeRootState,
    symbol: NetworkSymbol | undefined,
) => {
    const validatorsQueue = selectEthereumValidatorsQueue(state);
    const networkType = symbol ? getNetworkType(symbol) : undefined;

    return getUnstakingPeriodInDays(networkType, validatorsQueue);
};

export const selectEthereumEntryPeriodInDays = (state: StakeRootState) => {
    const validatorsQueue = selectEthereumValidatorsQueue(state);

    if (
        validatorsQueue?.activationTime === undefined ||
        validatorsQueue?.addingDelay === undefined
    ) {
        return undefined;
    }

    return getDaysToAddToPoolInitial(validatorsQueue);
};

export const selectEthereumNextRewardPayout = (state: StakeRootState) => {
    const nextRewardPayout = selectStakeData(state).eth?.stats?.nextRewardPayout;

    return nextRewardPayout ? Math.max(1, secondsToDays(nextRewardPayout)) : null;
};
