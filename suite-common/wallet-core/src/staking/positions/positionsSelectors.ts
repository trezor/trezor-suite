import { type StakingProviderId } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { deriveEthereumStakingPositions } from './deriveStakingPositions';
import { type StakingPosition, type StakingPositionsSummary } from './positionsTypes';
import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey } from '../../accounts/accountsSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<AccountsRootState>();

const EMPTY_SUMMARY: StakingPositionsSummary = {
    staked: '0',
    withdrawable: '0',
    pendingStake: '0',
    activating: '0',
    unstaking: '0',
    claimable: '0',
    rewards: null,
    canClaim: false,
    total: '0',
};

const sumAmounts = (positions: StakingPosition[], pick: (position: StakingPosition) => string) =>
    positions.reduce((total, position) => total.plus(pick(position)), new BigNumber(0)).toFixed();

const sumRewards = (positions: StakingPosition[]) => {
    const rewards = positions.map(position => position.rewards).filter(reward => reward !== null);

    if (rewards.length <= 0) return null;

    return rewards.reduce((total, reward) => total.plus(reward), new BigNumber(0)).toFixed();
};

export const selectStakingPositions = createMemoizedSelector(
    [selectAccountByKey],
    (account): StakingPosition[] =>
        account ? deriveEthereumStakingPositions(account) : returnStableArrayIfEmpty(),
);

export const selectStakingPosition = (
    state: AccountsRootState,
    accountKey: AccountKey,
    providerId: StakingProviderId,
): StakingPosition | null =>
    selectStakingPositions(state, accountKey).find(
        position => position.providerId === providerId,
    ) ?? null;

export const selectAccountHasStakingPosition = (state: AccountsRootState, accountKey: AccountKey) =>
    selectStakingPositions(state, accountKey).length > 0;

// Sums across every provider the account has a position with.
export const selectAccountStakingSummary = createMemoizedSelector(
    [selectStakingPositions],
    (positions): StakingPositionsSummary => {
        if (positions.length === 0) return EMPTY_SUMMARY;

        return {
            staked: sumAmounts(positions, position => position.staked),
            withdrawable: sumAmounts(positions, position => position.withdrawable),
            pendingStake: sumAmounts(positions, position => position.pendingStake),
            activating: sumAmounts(positions, position => position.activating),
            unstaking: sumAmounts(positions, position => position.unstaking),
            claimable: sumAmounts(positions, position => position.claimable),
            rewards: sumRewards(positions),
            canClaim: positions.some(position => position.canClaim),
            total: sumAmounts(positions, position => position.total),
        };
    },
);
