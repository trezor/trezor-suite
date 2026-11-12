import type { getStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

import { SOLANA_EPOCH_DAYS } from './constants';

export const SOLANA_EXTERNAL_PRODUCT_INFO = stakingProductInfoSchema.parse({
    rate: null,
    entryPeriodDays: null,
    exitPeriodDays: null,
    rewardPeriodDays: null,
    nextRewardAt: null,
    targets: [],
});

export type SolanaProductInfoDeps = {
    getStakingStats: typeof getStakingStats;
};

export const fetchSolanaProductInfo = async (
    deps: SolanaProductInfoDeps,
    { abortSignal }: FetchProductInfoParams,
): Promise<StakingProductInfo> => {
    // The staking API knows the mainnet chain APY only, so devnet reads the same number.
    const stats = await deps.getStakingStats({
        routeParams: { networkSymbol: 'sol' },
        signal: abortSignal,
    });

    const rate = stats.apy;
    const nextRewardAt = null;

    const entryPeriodDays = SOLANA_EPOCH_DAYS;
    const exitPeriodDays = SOLANA_EPOCH_DAYS;
    const rewardPeriodDays = SOLANA_EPOCH_DAYS;

    return stakingProductInfoSchema.parse({
        rate,
        entryPeriodDays,
        exitPeriodDays,
        rewardPeriodDays,
        nextRewardAt,
        targets: [],
    });
};
