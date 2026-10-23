import { planTronStakingStep } from './tronStakingPlan';
import { deriveTronStakingPositions } from './tronStakingPositions';
import {
    getTronAccountCastableVotes,
    getTronAccountVoteAllocations,
    getTronAccountVotes,
    getTronAccountVotingPower,
    getTronRewardClaimCooldownEndsAt,
    isTronRewardClaimSupported,
} from './tronStakingRules';
import { classifyTronStakingTransaction } from './tronStakingTransactions';
import { type TronStakingProductAdapter } from './types';
import { TRON_STAKING_LIMITS, TRON_UNFREEZE_DELAY_DAYS } from '../tronStakingConstants';

export const tronStakingAdapter: TronStakingProductAdapter = {
    networkType: 'tron',
    identityType: 'tron-super-representative',
    limits: TRON_STAKING_LIMITS,
    unstakingPeriodDays: TRON_UNFREEZE_DELAY_DAYS,
    derivePositions: deriveTronStakingPositions,
    classifyTransaction: classifyTronStakingTransaction,
    getVotes: getTronAccountVotes,
    getVotingPower: getTronAccountVotingPower,
    getCastableVotes: getTronAccountCastableVotes,
    getVoteAllocations: getTronAccountVoteAllocations,
    getRewardClaimCooldownEndsAt: getTronRewardClaimCooldownEndsAt,
    isRewardClaimSupported: isTronRewardClaimSupported,
    planStep: planTronStakingStep,
};
