import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { selectAccountByKey, selectDeviceAccounts } from '../../accounts/accountsSelectors';
import { type StakeRootState } from '../stakingReducerTypes';
import { selectStakeData } from '../stakingSelectors';
import {
    isCardanoStakedOutsideEverstake,
    isCardanoStakedWithFiveBinaries,
    isCardanoStakingActive,
} from './cardanoStakingUtils';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { getStakingDataForNetwork } from '../shared/stakingUtils';

const createMemoizedSelector = createWeakMapSelector.withTypes<StakeRootState>();

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
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'cardano') return null;

    const stakingData = getStakingDataForNetwork(account);

    return stakingData?.autocompoundBalance || '0';
};

export const selectCardanoRewardsBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'cardano') return null;

    const stakingData = getStakingDataForNetwork(account);

    return stakingData?.restakedReward ?? '0';
};

export const selectIsCardanoStakedWithFiveBinaries = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'cardano') return false;

    return isCardanoStakedWithFiveBinaries(account);
};

export const selectCardanoPoolsInfo = (state: StakeRootState) =>
    returnStableArrayIfEmpty(selectStakeData(state).ada?.pools);

export const selectIsCardanoStakedOutsideEverstake = (
    state: StakeRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    if (account?.networkType !== 'cardano') return false;

    const cardanoStakingPool = selectCardanoPoolsInfo(state);

    return isCardanoStakedOutsideEverstake(account, cardanoStakingPool);
};

export const selectFirstCardanoAccountStakedWithFiveBinaries = createMemoizedSelector(
    [selectDeviceAccounts],
    accounts =>
        accounts.find(account => account.visible && isCardanoStakedWithFiveBinaries(account)) ??
        null,
);
