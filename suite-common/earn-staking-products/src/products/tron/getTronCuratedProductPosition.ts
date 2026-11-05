import {
    type GetPositionParams,
    type StakingOperation,
    type StakingPosition,
    type StakingPositionBalances,
    type StakingPositionDetails,
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

// Copied from wallet-core tronStakingConstants.ts.
const TRON_STAKING_CONTRACT_TYPES = [
    'FreezeBalanceContract',
    'FreezeBalanceV2Contract',
    'UnfreezeBalanceContract',
    'UnfreezeBalanceV2Contract',
    'VoteWitnessContract',
    'WithdrawExpireUnfreezeContract',
    'WithdrawBalanceContract',
];

const isTronStakingTransaction = ({ tronSpecific }: StakingTransaction) =>
    tronSpecific?.contractType !== undefined &&
    TRON_STAKING_CONTRACT_TYPES.includes(tronSpecific.contractType);

type IsOperationAvailableParams = {
    operation: StakingOperation;
    balances: StakingPositionBalances;
    rewardClaimAvailableAt: number | null;
    nowMs: number;
};

const isOperationAvailable = ({
    operation,
    balances,
    rewardClaimAvailableAt,
    nowMs,
}: IsOperationAvailableParams): boolean => {
    switch (operation) {
        case 'stake':
            return true;
        case 'unstake':
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

    // The unfreeze queue and the claim cooldown move with time; the position
    // records each timestamp so a later sync can pick up the change.
    const nowMs = Date.now();

    const pendingBatches = stakingInfo.unstakingBatches
        .filter(({ availableAt }) => availableAt > nowMs)
        .toSorted((a, b) => a.availableAt - b.availableAt);

    const expiredBatches = stakingInfo.unstakingBatches.filter(
        ({ availableAt }) => availableAt <= nowMs,
    );

    const balances: StakingPositionBalances = {
        staked: stakingInfo.frozen,
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
            rewardClaimAvailableAt: stakingInfo.rewardClaimAvailableAt,
            nowMs,
        }),
    );

    const pendingTxids = transactions
        .filter(
            transaction =>
                isPendingStakingTransaction(transaction) && isTronStakingTransaction(transaction),
        )
        .map(({ txid }) => txid);

    const details: StakingPositionDetails = {
        kind: 'tron-staking',
        frozen: stakingInfo.frozenByResource,
        delegated: stakingInfo.delegatedByResource,
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
        pendingTxids,
        warnings: [],
        details,
    };
};
