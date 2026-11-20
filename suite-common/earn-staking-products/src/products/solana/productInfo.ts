import type { getStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

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

export type FetchSolanaProductInfoParams = FetchProductInfoParams & {
    networkSymbol: NetworkSymbol;
};

export const fetchSolanaProductInfo = async (
    deps: SolanaProductInfoDeps,
    { networkSymbol, abortSignal }: FetchSolanaProductInfoParams,
): Promise<StakingProductInfo> => {
    // The staking API knows the mainnet chain APY only, so devnet reads the same periods.
    const stats = await deps.getStakingStats({
        routeParams: { networkSymbol: 'sol' },
        signal: abortSignal,
    });

    if (stats.symbol !== 'sol') {
        throw new Error(`Expected sol staking stats, received ${stats.symbol}`);
    }

    // The stats rate the network they name; a product on another network, devnet, takes no rate,
    // as the legacy selectors left it.
    const rate = networkSymbol === asNetworkSymbol(stats.symbol) ? stats.apy : null;
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
