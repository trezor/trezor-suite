import z from 'zod';

import {
    type StakingAmount,
    type StakingProvider,
    type TronResourceAmounts,
} from '@suite-common/earn-staking-common';
import { tronAddressToBytes } from '@trezor/network-tron/utils';

import { type TRON_RESOURCES } from './constants';

export type TronResource = (typeof TRON_RESOURCES)[number];

export type TronRepresentative = {
    address: string;
    provider: StakingProvider;
};

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

export const tronStakingListsSchema = z.object({
    unstakingBatches: z.array(z.unknown()),
    votes: z.array(z.unknown()),
});

export const tronUnstakingBatchSchema = z.object({ amount: z.string(), expireTime: z.number() });

export const tronVoteSchema = z.object({
    address: z.string().refine(address => tronAddressToBytes(address) !== null),
    voteCount: z.string(),
});
