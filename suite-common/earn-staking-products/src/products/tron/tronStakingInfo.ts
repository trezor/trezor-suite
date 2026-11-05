import { z } from 'zod';

import {
    type StakingAccount,
    type StakingAmount,
    type TronResourceAmounts,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { tronAddressToBytes } from '@trezor/network-tron/utils';
import { BigNumber } from '@trezor/utils';

import { sumStakingAmounts } from '../../utils/stakingAmounts';

const TRON_DECIMALS = 6;
const TRON_REWARD_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type ParsedTronUnstakingBatch = {
    amount: StakingAmount;
    availableAt: number;
};

export type ParsedTronVote = {
    address: string;
    amount: StakingAmount;
};

export type ParsedTronStakingInfo = {
    frozen: StakingAmount;
    staked: StakingAmount;
    frozenByResource: TronResourceAmounts;
    delegatedByResource: TronResourceAmounts;
    votingPower: StakingAmount;
    unstakingBatches: readonly ParsedTronUnstakingBatch[];
    votes: readonly ParsedTronVote[];
    unallocatedVotingPower: StakingAmount;
    unclaimedReward: StakingAmount;
    rewardClaimAvailableAt: number | null;
};

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

const tronStakingListsSchema = z.object({
    unstakingBatches: z.array(z.unknown()),
    votes: z.array(z.unknown()),
});

const tronUnstakingBatchSchema = z.object({ amount: z.string(), expireTime: z.number() });

const tronVoteSchema = z.object({
    address: z.string().refine(address => tronAddressToBytes(address) !== null),
    voteCount: z.string(),
});

// A malformed vote or batch is left out; a malformed core amount or list leaves the
// account without a position instead of failing the sync of the whole account.
export const parseTronStakingInfo = ({ misc }: StakingAccount): ParsedTronStakingInfo | null => {
    const stakingInfo = misc?.tronResources?.stakingInfo;

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
