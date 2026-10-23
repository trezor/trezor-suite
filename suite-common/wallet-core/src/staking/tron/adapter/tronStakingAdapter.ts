import { planTronStakingStep } from './tronStakingPlan';
import { deriveTronStakingPositions } from './tronStakingPositions';
import {
    getTronAccountCastableVotes,
    getTronAccountVoteAllocations,
    getTronAccountVotes,
    getTronAccountVotingPower,
    getTronClaimableRewards,
    getTronPendingUnfreezeAmount,
    getTronRewardClaimCooldownEndsAt,
    getTronUnfreezeBatches,
    getTronWithdrawableAmount,
    isTronRewardClaimSupported,
} from './tronStakingRules';
import {
    composeTronStakingStepTransaction,
    getTronStakingStepPendingTransaction,
    isTronStakingTxidReportedBeforeBroadcast,
} from './tronStakingSteps';
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
    getUnfreezeBatches: getTronUnfreezeBatches,
    getWithdrawableAmount: getTronWithdrawableAmount,
    getPendingUnfreezeAmount: getTronPendingUnfreezeAmount,
    getClaimableRewards: getTronClaimableRewards,
    getRewardClaimCooldownEndsAt: getTronRewardClaimCooldownEndsAt,
    isRewardClaimSupported: isTronRewardClaimSupported,
    planStep: planTronStakingStep,
    composeStepTransaction: composeTronStakingStepTransaction,
    getPendingTransaction: getTronStakingStepPendingTransaction,
    isTxidReportedBeforeBroadcast: isTronStakingTxidReportedBeforeBroadcast,
};
