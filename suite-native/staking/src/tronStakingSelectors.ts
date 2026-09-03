import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    getStakingDataForNetwork,
    getTronAvailableVotingPower,
    getTronPendingUnstakeBalance,
    getTronTotalVotingPower,
    getTronVotes,
    getTronWithdrawableBalance,
    isTronStakingActive,
} from '@suite-common/staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { type NativeStakingRootState } from './types';

const createMemoizedSelector = createWeakMapSelector.withTypes<NativeStakingRootState>();

export const selectVisibleDeviceTronAccountsWithStakingByNetworkSymbol = createMemoizedSelector(
    [selectDeviceAccounts, (_state, symbol: NetworkSymbol) => symbol],
    accounts =>
        returnStableArrayIfEmpty(
            accounts.filter(
                account =>
                    account.visible && account.symbol === 'trx' && isTronStakingActive(account),
            ),
        ),
);

export const selectTronAccountHasStaked = (state: AccountsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'tron') return false;

    return isTronStakingActive(account);
};

export const selectTronStakedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'tron') return null;

    const stakingData = getStakingDataForNetwork(account);

    return stakingData?.autocompoundBalance ?? '0';
};

export const selectTronRewardsBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'tron') return null;

    const stakingData = getStakingDataForNetwork(account);

    return stakingData?.restakedReward ?? '0';
};

/** TRX whose unfreeze window has elapsed and is ready to be withdrawn. */
export const selectTronUnstakedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'tron') return '0';

    return getTronWithdrawableBalance(account);
};

/** TRX still in the unfreeze queue (being unstaked, not yet withdrawable). */
export const selectTronPendingUnstakeBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'tron') return '0';

    return getTronPendingUnstakeBalance(account);
};

export const selectTronVotesByAccountKey = (state: AccountsRootState, accountKey: AccountKey) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'tron') return [];

    return getTronVotes(account);
};

export const selectTronTotalVotingPowerByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'tron') return '0';

    return getTronTotalVotingPower(account);
};

export const selectTronAvailableVotingPowerByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'tron') return '0';

    return getTronAvailableVotingPower(account);
};
