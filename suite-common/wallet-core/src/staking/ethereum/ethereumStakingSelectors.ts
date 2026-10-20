import { type NetworkSymbol } from '@suite-common/networks';
import { getNetworkType } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPending, secondsToDays } from '@suite-common/wallet-utils';

import { getDaysToAddToPoolInitial } from './providers/everstake/everstakeTimelines';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectDeviceAccounts } from '../../accounts/accountsSelectors';
import { selectAccountStakeTransactions } from '../../transactions/transactionsSelectors';
import { deriveEthereumStakingPositions } from '../positions/deriveStakingPositions';
import {
    selectAccountHasStakingPosition,
    selectAccountStakingSummary,
} from '../positions/positionsSelectors';
import { selectStakeData } from '../shared/stakingSelectors';
import { getUnstakingPeriodInDays } from '../shared/stakingUtils';
import { type StakeRootState } from '../stakingReducerTypes';

export const selectVisibleDeviceEthereumAccountsWithStakingByNetworkSymbol = (
    state: StakeRootState,
    symbol: NetworkSymbol | null,
) => {
    const accounts = selectDeviceAccounts(state);

    return accounts.filter(
        account =>
            account.symbol === symbol &&
            account.visible &&
            deriveEthereumStakingPositions(account).length > 0,
    );
};

export const selectEthereumAccountHasStaking = (state: StakeRootState, accountKey: AccountKey) =>
    selectAccountHasStakingPosition(state, accountKey);

export const selectEthereumIsStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => Number(selectAccountStakingSummary(state, accountKey).pendingStake) > 0;

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
) => selectAccountStakingSummary(state, accountKey).staked;

export const selectEthereumRewardsBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => selectAccountStakingSummary(state, accountKey).rewards ?? '0';

export const selectEthereumTotalStakePendingByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => selectAccountStakingSummary(state, accountKey).pendingStake;

export const selectEthereumClaimableAmountByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => selectAccountStakingSummary(state, accountKey).claimable;

export const selectEthereumCanClaimByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => selectAccountStakingSummary(state, accountKey).canClaim;

export const selectEthereumUnstakingBalanceByAccountKey = (
    state: AccountsRootState,
    accountKey: AccountKey,
) => selectAccountStakingSummary(state, accountKey).unstaking;

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
