import { type NetworkSymbol } from '@suite-common/networks';
import { type StakingProviderId, getNetworkType } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { type EthereumProviderStats } from './ethereumStakingStats';
import {
    DEFAULT_ETHEREUM_STAKING_PROVIDER_ID,
    getEthereumStakingAdapter,
} from './providers/ethereumStakingProviders';
import { type StakingTimelineDefaults, type StakingTimelines } from './providers/types';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectDeviceAccounts } from '../../accounts/accountsSelectors';
import {
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
} from '../../transactions/transactionsSelectors';
import { deriveEthereumStakingPositions } from '../positions/deriveStakingPositions';
import {
    selectAccountHasStakingPosition,
    selectAccountStakingSummary,
    selectStakingPositions,
} from '../positions/positionsSelectors';
import { selectStakeData } from '../shared/stakingSelectors';
import { getUnstakingPeriodInDays } from '../shared/stakingUtils';
import { type StakeRootState } from '../stakingReducerTypes';

const createMemoizedSelector = createWeakMapSelector.withTypes<StakeRootState>();

const EMPTY_TIMELINE_CONTEXT = { stakeTxs: [], unstakeTxs: [] };

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

// The provider of the account's position, or the default one before it has a position.
export const selectAccountEthereumStakingProviderId = (
    state: AccountsRootState,
    accountKey: AccountKey,
): StakingProviderId =>
    selectStakingPositions(state, accountKey)[0]?.providerId ??
    DEFAULT_ETHEREUM_STAKING_PROVIDER_ID;

export const selectEthereumProviderStats = (
    state: StakeRootState,
    providerId: StakingProviderId,
): EthereumProviderStats | undefined => selectStakeData(state).eth?.[providerId];

export const getEthereumStakingTimelineDefaults = (
    providerId: StakingProviderId = DEFAULT_ETHEREUM_STAKING_PROVIDER_ID,
): StakingTimelineDefaults => getEthereumStakingAdapter(providerId).timelineDefaults;

// Estimates that do not depend on an account, for screens shown before staking.
export const selectEthereumProviderTimelines = createMemoizedSelector(
    [
        selectEthereumProviderStats,
        (_state: StakeRootState, providerId: StakingProviderId) => providerId,
    ],
    (stats, providerId): StakingTimelines =>
        getEthereumStakingAdapter(providerId).timelines(stats, EMPTY_TIMELINE_CONTEXT),
);

export const selectEthereumStakingTimelines = createMemoizedSelector(
    [
        (state: StakeRootState, accountKey: AccountKey) =>
            selectEthereumProviderStats(
                state,
                selectAccountEthereumStakingProviderId(state, accountKey),
            ),
        selectAccountEthereumStakingProviderId,
        selectAccountStakeTransactions,
        selectAccountUnstakeTransactions,
    ],
    (stats, providerId, stakeTxs, unstakeTxs): StakingTimelines =>
        getEthereumStakingAdapter(providerId).timelines(stats, { stakeTxs, unstakeTxs }),
);

// The default provider's validators queue; the Everstake-specific screens still read it directly.
export const selectEthereumValidatorsQueue = (state: StakeRootState) =>
    selectEthereumProviderStats(state, DEFAULT_ETHEREUM_STAKING_PROVIDER_ID)?.validators;

export const selectUnstakingPeriodInDaysBySymbol = (
    state: StakeRootState,
    symbol: NetworkSymbol | undefined,
) => {
    const networkType = symbol ? getNetworkType(symbol) : undefined;

    if (networkType === 'ethereum') {
        return selectEthereumProviderTimelines(state, DEFAULT_ETHEREUM_STAKING_PROVIDER_ID)
            .exitPeriodDays;
    }

    return getUnstakingPeriodInDays(networkType);
};

export const selectEthereumEntryPeriodInDays = (state: StakeRootState) =>
    selectEthereumProviderTimelines(state, DEFAULT_ETHEREUM_STAKING_PROVIDER_ID).initialEntryDays;

export const selectEthereumNextRewardPayout = (state: StakeRootState) =>
    selectEthereumProviderTimelines(state, DEFAULT_ETHEREUM_STAKING_PROVIDER_ID)
        .nextRewardPayoutDays;
