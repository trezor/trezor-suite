import {
    type StakingAccount,
    type StakingAmount,
    type StakingOperation,
    type StakingOptionValue,
    type StakingPositionBalances,
    type StakingPositionPendingTransaction,
    type StakingPositionTarget,
    type StakingPositionUnlock,
    type StakingProvider,
    type StakingTransaction,
    isPendingStakingTransaction,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@trezor/network-module-types';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { TRON_RESOURCES, TRON_STAKING_OPERATIONS_BY_TRON_CONTRACT_TYPE } from './constants';
import {
    type ParsedTronStakingInfo,
    type ParsedTronUnstakingBatch,
    type ParsedTronVote,
    type TronRepresentative,
    type TronResource,
    tronStakingListsSchema,
    tronUnstakingBatchSchema,
    tronVoteSchema,
} from './types';
import { externalProvider } from '../../../providers/external';
import {
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    sumStakingAmounts,
} from '../../../utils/stakingAmounts';

export const isTronResource = (value: StakingOptionValue): value is TronResource =>
    TRON_RESOURCES.some(resource => resource === value);

export type GetTronRepresentativesParams = {
    networkSymbol: NetworkSymbol;
    providers: readonly StakingProvider[];
};

export const getTronRepresentatives = ({
    networkSymbol,
    providers,
}: GetTronRepresentativesParams): readonly TronRepresentative[] =>
    providers.flatMap(provider => {
        if (provider.status !== 'active') return [];

        const identities = provider.identities[networkSymbol];

        if (!identities) return [];

        return identities.map(address => ({ address, provider }));
    });

const TRON_DECIMALS = 6;
const TRON_REWARD_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const parseSun = (value: string): StakingAmount | null => {
    const result = stakingAmountSchema.safeParse(value);

    return result.success ? result.data : null;
};

const toSun = (trx: BigNumber): StakingAmount | null =>
    trx.isFinite() ? parseSun(trx.shiftedBy(TRON_DECIMALS).toFixed()) : null;

// Blockbook reports votes and voting power in TRX; positions keep every amount in sun.
const parseTrxAsSun = (value: string) => toSun(new BigNumber(value));

// Tron counts votes in whole TRX.
const parseVotingPower = (value: string) =>
    toSun(new BigNumber(value).integerValue(BigNumber.ROUND_FLOOR));

const toMilliseconds = (seconds: number) => Math.round(seconds * 1000);

type GetParsedTronStakingInfoParams = {
    account: StakingAccount;
};

// A malformed vote or batch is left out; a malformed core amount or list leaves the
// account without a position instead of failing the sync of the whole account.
export const getParsedTronStakingInfo = ({
    account,
}: GetParsedTronStakingInfoParams): ParsedTronStakingInfo | null => {
    const stakingInfo = account.misc?.tronResources?.stakingInfo;

    if (stakingInfo === undefined) return null;

    const lists = tronStakingListsSchema.safeParse(stakingInfo);

    if (!lists.success) return null;

    const frozen = parseSun(stakingInfo.stakedBalance);
    const frozenEnergy = parseSun(stakingInfo.stakedBalanceEnergy);
    const frozenBandwidth = parseSun(stakingInfo.stakedBalanceBandwidth);
    const delegatedEnergy = parseSun(stakingInfo.delegatedBalanceEnergy);
    const delegatedBandwidth = parseSun(stakingInfo.delegatedBalanceBandwidth);
    const votingPower = parseVotingPower(stakingInfo.totalVotingPower);
    const unallocatedVotingPower = parseTrxAsSun(stakingInfo.availableVotingPower);
    const unclaimedReward = parseSun(stakingInfo.unclaimedReward);

    if (
        frozen === null ||
        frozenEnergy === null ||
        frozenBandwidth === null ||
        delegatedEnergy === null ||
        delegatedBandwidth === null ||
        votingPower === null ||
        unallocatedVotingPower === null ||
        unclaimedReward === null
    ) {
        return null;
    }

    const unstakingBatches = lists.data.unstakingBatches.flatMap(value => {
        const batch = tronUnstakingBatchSchema.safeParse(value);
        const amount = batch.success ? parseSun(batch.data.amount) : null;

        return batch.success && amount !== null
            ? [{ amount, availableAt: toMilliseconds(batch.data.expireTime) }]
            : [];
    });

    const votes = lists.data.votes
        .flatMap(value => {
            const vote = tronVoteSchema.safeParse(value);
            const amount = vote.success ? parseTrxAsSun(vote.data.voteCount) : null;

            return vote.success && amount !== null ? [{ address: vote.data.address, amount }] : [];
        })
        .filter(
            ({ address }, index, parsedVotes) =>
                parsedVotes.findIndex(vote => vote.address === address) === index,
        );

    const frozenByResource = { energy: frozenEnergy, bandwidth: frozenBandwidth };
    const delegatedByResource = { energy: delegatedEnergy, bandwidth: delegatedBandwidth };

    const rewardClaimAvailableAt =
        stakingInfo.latestWithdrawTime > 0
            ? toMilliseconds(stakingInfo.latestWithdrawTime) + TRON_REWARD_CLAIM_COOLDOWN_MS
            : null;

    // Delegating moves TRX out of the account's frozen balance; it stays locked and still votes.
    const staked = sumStakingAmounts([frozen, delegatedEnergy, delegatedBandwidth]);

    return {
        frozen,
        staked,
        frozenByResource,
        delegatedByResource,
        votingPower,
        unstakingBatches,
        votes,
        unallocatedVotingPower,
        unclaimedReward,
        rewardClaimAvailableAt,
    };
};

type IsTronCuratedPositionOperationAvailableParams = {
    operation: StakingOperation;
    balances: StakingPositionBalances;
    frozen: StakingAmount;
    rewardClaimAvailableAt: number | null;
    nowMs: number;
};

const isTronCuratedPositionOperationAvailable = ({
    operation,
    balances,
    frozen,
    rewardClaimAvailableAt,
    nowMs,
}: IsTronCuratedPositionOperationAvailableParams): boolean => {
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

type GetTronCuratedPositionBalancesParams = {
    stakingInfo: ParsedTronStakingInfo;
    pendingBatches: ParsedTronUnstakingBatch[];
    expiredBatches: ParsedTronUnstakingBatch[];
};

export const getTronCuratedPositionBalances = ({
    stakingInfo,
    pendingBatches,
    expiredBatches,
}: GetTronCuratedPositionBalancesParams): StakingPositionBalances => {
    const { staked } = stakingInfo;
    const rewards = stakingInfo.unclaimedReward;

    const unstaking = sumStakingAmounts(pendingBatches.map(({ amount }) => amount));
    const withdrawable = sumStakingAmounts(expiredBatches.map(({ amount }) => amount));

    const pending = ZERO_STAKING_AMOUNT;

    return { staked, pending, unstaking, withdrawable, rewards };
};

type GetTronCuratedPositionOperationsParams = {
    operations: readonly StakingOperation[];
    balances: StakingPositionBalances;
    stakingInfo: ParsedTronStakingInfo;
    nowMs: number;
};

export const getTronCuratedPositionOperations = ({
    operations,
    balances,
    stakingInfo,
    nowMs,
}: GetTronCuratedPositionOperationsParams): StakingOperation[] =>
    operations.filter(operation =>
        isTronCuratedPositionOperationAvailable({
            operation,
            balances,
            frozen: stakingInfo.frozen,
            rewardClaimAvailableAt: stakingInfo.rewardClaimAvailableAt,
            nowMs,
        }),
    );

type GetTronCuratedPendingTransactionsParams = {
    transactions: readonly StakingTransaction[];
};

export const getTronCuratedPendingTransactions = ({
    transactions,
}: GetTronCuratedPendingTransactionsParams): StakingPositionPendingTransaction[] => {
    const pendingStakingTransactions = transactions.filter(isPendingStakingTransaction);

    return pendingStakingTransactions.flatMap(({ txid, tronSpecific }) => {
        const contractType = tronSpecific?.contractType;
        const operation =
            contractType === undefined
                ? undefined
                : TRON_STAKING_OPERATIONS_BY_TRON_CONTRACT_TYPE[contractType];

        return operation === undefined ? [] : [{ txid, operation }];
    });
};

type GetVoteTargetsParams = {
    votes: readonly ParsedTronVote[];
    representatives: readonly TronRepresentative[];
};

export const getTronCuratedPositionTargets = ({
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

type GetTronCuratedPositionUnlocksParams = {
    pendingBatches: ParsedTronUnstakingBatch[];
};

export const getTronCuratedPositionUnlocks = ({
    pendingBatches,
}: GetTronCuratedPositionUnlocksParams): StakingPositionUnlock[] =>
    pendingBatches.map(({ amount, availableAt }) => ({ amount, availableAt }));
