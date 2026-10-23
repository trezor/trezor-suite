import { deriveTronStakingPositions } from './tronStakingPositions';
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
};
