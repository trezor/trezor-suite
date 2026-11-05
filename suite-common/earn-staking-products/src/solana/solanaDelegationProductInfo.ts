import type { getStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

import { SOLANA_EPOCH_DAYS } from './solanaEpochReward';

export type SolanaDelegationProductInfoDeps = {
    getStakingStats: typeof getStakingStats;
};

export const SOLANA_EXTERNAL_PRODUCT_INFO = stakingProductInfoSchema.parse({
    rate: null,
    entryPeriodDays: null,
    exitPeriodDays: null,
    nextRewardAt: null,
    targets: [],
});

export const fetchSolanaDelegationProductInfo = async (
    deps: SolanaDelegationProductInfoDeps,
    { abortSignal }: FetchProductInfoParams,
): Promise<StakingProductInfo> => {
    // The staking API knows the mainnet chain APY only, so devnet reads the same number.
    const stats = await deps.getStakingStats({
        routeParams: { networkSymbol: 'sol' },
        signal: abortSignal,
    });

    return stakingProductInfoSchema.parse({
        rate: stats.apy,
        entryPeriodDays: SOLANA_EPOCH_DAYS,
        exitPeriodDays: SOLANA_EPOCH_DAYS,
        nextRewardAt: null,
        targets: [],
    });
};
