import {
    type GetPositionParams,
    type StakingPosition,
    type StakingPositionDetails,
    type StakingProductDescriptor,
} from '@suite-common/earn-staking-common';

import { type TronRepresentative } from './types';
import {
    getParsedTronStakingInfo,
    getTronCuratedPendingTransactions,
    getTronCuratedPositionBalances,
    getTronCuratedPositionOperations,
    getTronCuratedPositionTargets,
    getTronCuratedPositionUnlocks,
} from './utils';
import { getStakingPositionStatus } from '../../../utils/getStakingPositionStatus';
import { isPositiveStakingAmount } from '../../../utils/stakingAmounts';

// The staking contract types of wallet-core tronStakingConstants.ts.
// Blockbook truncates the unlock and withdraw times to seconds.
const TRON_REVALIDATE_BUFFER_MS = 1000;

export type GetTronCuratedProductPositionParams = GetPositionParams & {
    descriptor: StakingProductDescriptor;
    representatives: readonly TronRepresentative[];
};

export const getTronCuratedProductPosition = ({
    descriptor,
    representatives,
    account,
    transactions,
}: GetTronCuratedProductPositionParams): StakingPosition | null => {
    const stakingInfo = getParsedTronStakingInfo({ account });

    if (stakingInfo === null) {
        return null;
    }

    const nowMs = Date.now();

    const pendingBatches = stakingInfo.unstakingBatches
        .filter(({ availableAt }) => availableAt > nowMs)
        .toSorted((a, b) => a.availableAt - b.availableAt);

    const expiredBatches = stakingInfo.unstakingBatches.filter(
        ({ availableAt }) => availableAt <= nowMs,
    );

    const balances = getTronCuratedPositionBalances({
        stakingInfo,
        pendingBatches,
        expiredBatches,
    });

    const status = getStakingPositionStatus({ balances });

    if (Object.values(balances).every(amount => !isPositiveStakingAmount(amount))) {
        return null;
    }

    const operations = getTronCuratedPositionOperations({
        operations: descriptor.operations,
        balances,
        stakingInfo,
        nowMs,
    });

    const targets = getTronCuratedPositionTargets({ votes: stakingInfo.votes, representatives });
    const unlocks = getTronCuratedPositionUnlocks({ pendingBatches });

    const pendingTransactions = getTronCuratedPendingTransactions({ transactions });

    const { rewardClaimAvailableAt } = stakingInfo;

    const isClaimOnCooldown =
        isPositiveStakingAmount(balances.rewards) &&
        rewardClaimAvailableAt !== null &&
        rewardClaimAvailableAt > nowMs;

    const changesAt = [
        ...pendingBatches.map(({ availableAt }) => availableAt),
        ...(isClaimOnCooldown ? [rewardClaimAvailableAt] : []),
    ];

    const details: StakingPositionDetails = {
        kind: 'tron-staking',
        frozen: stakingInfo.frozenByResource,
        delegated: stakingInfo.delegatedByResource,
        votingPower: stakingInfo.votingPower,
        unallocatedVotingPower: stakingInfo.unallocatedVotingPower,
        rewardClaimAvailableAt: stakingInfo.rewardClaimAvailableAt,
    };

    const revalidateAt =
        changesAt.length === 0 ? null : Math.min(...changesAt) + TRON_REVALIDATE_BUFFER_MS;

    return {
        productId: descriptor.id,
        status,
        lockup: 'locked',
        balances,
        unlocks,
        targets,
        operations,
        pendingTransactions,
        warnings: [],
        details,
        revalidateAt,
    };
};
