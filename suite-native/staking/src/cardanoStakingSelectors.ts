import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountByKey,
    selectCardanoPoolsInfo,
    selectDeviceAccounts,
} from '@suite-common/wallet-core';
import {
    getStakingDataForNetwork,
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithFiveBinaries,
    isCardanoStakingActive,
} from '@suite-common/wallet-utils';

import { NativeStakingRootState } from './types';

export const createMemoizedSelector = createWeakMapSelector.withTypes<NativeStakingRootState>();

export const selectVisibleDeviceCardanoAccountsWithStakingByNetworkSymbol = createMemoizedSelector(
    [selectDeviceAccounts, (_state, symbol: NetworkSymbol) => symbol],
    accounts =>
        returnStableArrayIfEmpty(
            accounts.filter(
                account =>
                    account.visible && account.symbol === 'ada' && isCardanoStakingActive(account),
            ),
        ),
);

export const selectCardanoStakedBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account || account.networkType !== 'cardano') return null;

    const stakingData = getStakingDataForNetwork(account);

    return stakingData?.autocompoundBalance ?? '0';
};

export const selectCardanoRewardsBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account || account.networkType !== 'cardano') return null;

    const stakingData = getStakingDataForNetwork(account);

    return stakingData?.restakedReward ?? '0';
};

export const selectCardanoTotalStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account || account.networkType !== 'cardano') return null;

    const stakingData = getStakingDataForNetwork(account);

    return stakingData?.totalPendingStakeBalance ?? '0';
};

export const selectIsCardanoStakedWithFiveBinaries = (
    state: AccountsRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account || account.networkType !== 'cardano') return false;

    return isCardanoStakedWithFiveBinaries(account);
};

export const selectIsCardanoStakedOutsideEverstake = (
    state: NativeStakingRootState,
    accountKey: string,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (!account || account.networkType !== 'cardano') return false;

    const cardanoStakingPool = selectCardanoPoolsInfo(state);

    return isCardanoStakedOutsideEverstake(account, cardanoStakingPool);
};
export const selectFirstCardanoAccountStakedWithFiveBinaries = createMemoizedSelector(
    [selectDeviceAccounts],
    accounts =>
        accounts.find(account => account.visible && isCardanoStakedWithFiveBinaries(account)) ??
        null,
);
