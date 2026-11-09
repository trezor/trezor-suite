import {
    type StakingAmount,
    type StakingProvider,
    type TronResourceAmounts,
} from '@suite-common/earn-staking-common';

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
