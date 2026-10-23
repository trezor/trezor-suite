import { weakMapMemoize } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { type StakingPosition, type StakingPositionsSummary } from './positionsTypes';

const EMPTY_SUMMARY: StakingPositionsSummary = {
    staked: '0',
    withdrawable: '0',
    pendingStake: '0',
    activating: '0',
    unstaking: '0',
    claimable: '0',
    rewards: null,
    claimableRewards: '0',
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

// Memoized on the positions array, which keeps its reference while the account is unchanged.
export const summarizeStakingPositions = weakMapMemoize(
    (positions: StakingPosition[]): StakingPositionsSummary => {
        if (positions.length === 0) return EMPTY_SUMMARY;

        return {
            staked: sumAmounts(positions, position => position.staked),
            withdrawable: sumAmounts(positions, position => position.withdrawable),
            pendingStake: sumAmounts(positions, position => position.pendingStake),
            activating: sumAmounts(positions, position => position.activating),
            unstaking: sumAmounts(positions, position => position.unstaking),
            claimable: sumAmounts(positions, position => position.claimable),
            rewards: sumRewards(positions),
            claimableRewards: sumAmounts(positions, position => position.claimableRewards),
            canClaim: positions.some(position => position.canClaim),
            total: sumAmounts(positions, position => position.total),
        };
    },
);
