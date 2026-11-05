import {
    type GetPositionParams,
    type StakingAmount,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingPositionDetails,
    type StakingPositionPendingTransaction,
    type StakingPositionTarget,
    type StakingProductDescriptor,
    type StakingTransaction,
    isPendingStakingTransaction,
} from '@suite-common/earn-staking-common';
import { exhaustive } from '@trezor/type-utils';

import type { TronRepresentative } from './tronRepresentatives';
import { type ParsedTronVote, parseTronStakingInfo } from './tronStakingInfo';
import { externalProvider } from '../../providers/external';
import { getStakingPositionStatus } from '../../utils/getStakingPositionStatus';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    sumStakingAmounts,
} from '../../utils/stakingAmounts';

// The staking contract types of wallet-core tronStakingConstants.ts.
// Blockbook truncates the unlock and withdraw times to seconds.
const TRON_REVALIDATE_BUFFER_MS = 1000;

const OPERATIONS_BY_TRON_CONTRACT_TYPE: Partial<Record<string, StakingOperation>> = {
    FreezeBalanceContract: 'stake',
    FreezeBalanceV2Contract: 'stake',
    UnfreezeBalanceContract: 'unstake',
    UnfreezeBalanceV2Contract: 'unstake',
    VoteWitnessContract: 'vote',
    WithdrawExpireUnfreezeContract: 'withdraw',
    WithdrawBalanceContract: 'claim',
};

const getPendingTronStakingTransactions = (
    transactions: readonly StakingTransaction[],
): StakingPositionPendingTransaction[] =>
    transactions.filter(isPendingStakingTransaction).flatMap(({ txid, tronSpecific }) => {
        const contractType = tronSpecific?.contractType;
        const operation =
            contractType === undefined ? undefined : OPERATIONS_BY_TRON_CONTRACT_TYPE[contractType];

        return operation === undefined ? [] : [{ txid, operation }];
    });

type IsOperationAvailableParams = {
    operation: StakingOperation;
    balances: StakingPositionBalances;
    frozen: StakingAmount;
    rewardClaimAvailableAt: number | null;
    nowMs: number;
};

const isOperationAvailable = ({
    operation,
    balances,
    frozen,
    rewardClaimAvailableAt,
    nowMs,
}: IsOperationAvailableParams): boolean => {
    switch (operation) {
        case 'stake':
            return true;
        case 'unstake':
            return isPositiveStakingAmount(frozen);
        case 'vote':
            return isPositiveStakingAmount(balances.staked);
        case 'withdraw':
            return isPositiveStakingAmount(balances.withdrawable);
        case 'claim':
            return (
                isPositiveStakingAmount(balances.rewards) &&
                (rewardClaimAvailableAt === null || rewardClaimAvailableAt <= nowMs)
            );
        case 'redelegate':
            return false;
        default:
            return exhaustive(operation);
    }
};

type GetVoteTargetsParams = {
    votes: readonly ParsedTronVote[];
    representatives: readonly TronRepresentative[];
};

const getVoteTargets = ({
    votes,
    representatives,
}: GetVoteTargetsParams): StakingPositionTarget[] =>
    votes
        .filter(({ amount }) => isPositiveStakingAmount(amount))
        .map(({ address, amount }) => {
            const provider =
                representatives.find(candidate => candidate.address === address)?.provider ??
                externalProvider;

            return {
                address,
                providerId: provider.id,
                ...(provider.status === 'external' ? {} : { name: provider.name }),
                amount,
            };
        });

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
    const stakingInfo = parseTronStakingInfo(account);

    if (stakingInfo === null) return null;

    const nowMs = Date.now();

    const pendingBatches = stakingInfo.unstakingBatches
        .filter(({ availableAt }) => availableAt > nowMs)
        .toSorted((a, b) => a.availableAt - b.availableAt);

    const expiredBatches = stakingInfo.unstakingBatches.filter(
        ({ availableAt }) => availableAt <= nowMs,
    );

    const balances: StakingPositionBalances = {
        staked: stakingInfo.staked,
        pending: ZERO_STAKING_AMOUNT,
        unstaking: sumStakingAmounts(pendingBatches.map(({ amount }) => amount)),
        withdrawable: sumStakingAmounts(expiredBatches.map(({ amount }) => amount)),
        rewards: stakingInfo.unclaimedReward,
    };

    if (Object.values(balances).every(amount => !isPositiveStakingAmount(amount))) {
        return null;
    }

    const operations = descriptor.operations.filter(operation =>
        isOperationAvailable({
            operation,
            balances,
            frozen: stakingInfo.frozen,
            rewardClaimAvailableAt: stakingInfo.rewardClaimAvailableAt,
            nowMs,
        }),
    );

    const pendingTransactions = getPendingTronStakingTransactions(transactions);

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

    return {
        productId: descriptor.id,
        status: getStakingPositionStatus({ balances }),
        lockup: 'locked',
        balances,
        unlocks: pendingBatches.map(({ amount, availableAt }) => ({ amount, availableAt })),
        targets: getVoteTargets({ votes: stakingInfo.votes, representatives }),
        operations,
        pendingTransactions,
        warnings: [],
        details,
        revalidateAt:
            changesAt.length === 0 ? null : Math.min(...changesAt) + TRON_REVALIDATE_BUFFER_MS,
    };
};
