import type { getEthereumValidatorsQueue, getStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

export type EverstakePooledProductInfoDeps = {
    getStakingStats: typeof getStakingStats;
    getEthereumValidatorsQueue: typeof getEthereumValidatorsQueue;
};

const SECONDS_IN_DAY = 24 * 60 * 60;

const getPeriodDays = (firstSeconds?: number, secondSeconds?: number): number | null => {
    if (firstSeconds === undefined || secondSeconds === undefined) return null;

    return Math.max(1, Math.round((firstSeconds + secondSeconds) / SECONDS_IN_DAY));
};

export const fetchEverstakePooledProductInfo = async (
    deps: EverstakePooledProductInfoDeps,
    { abortSignal }: FetchProductInfoParams,
): Promise<StakingProductInfo> => {
    // The staking API knows mainnet only, so Hoodi reads the same numbers.
    const [stats, queue] = await Promise.all([
        deps.getStakingStats({ routeParams: { networkSymbol: 'eth' }, signal: abortSignal }),
        deps.getEthereumValidatorsQueue({ signal: abortSignal }),
    ]);

    return stakingProductInfoSchema.parse({
        rate: stats.apy,
        entryPeriodDays: getPeriodDays(queue.addingDelay, queue.activationTime),
        exitPeriodDays: getPeriodDays(queue.withdrawTime, queue.exitTime),
        nextRewardAt:
            stats.symbol === 'eth' ? Date.now() + Math.round(stats.nextRewardPayout * 1000) : null,
        targets: [],
    });
};
