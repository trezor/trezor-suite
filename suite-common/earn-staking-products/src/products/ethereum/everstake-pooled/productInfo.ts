import type { getEthereumValidatorsQueue, getStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

const getPeriodDays = (firstSeconds?: number, secondSeconds?: number): number | null => {
    if (firstSeconds === undefined || secondSeconds === undefined) return null;

    const secondsInDay = 24 * 60 * 60;

    return Math.round((firstSeconds + secondSeconds) / secondsInDay);
};

const HOUR_MS = 60 * 60 * 1000;

// Rounded to the hour so that refetching the same stats yields equal product info.
const getNextRewardAt = (nextRewardPayout: number): number => {
    const nextRewardAt = Date.now() + nextRewardPayout * 1000;

    return Math.round(nextRewardAt / HOUR_MS) * HOUR_MS;
};

export type EthereumEverstakePooledProductInfoDeps = {
    getStakingStats: typeof getStakingStats;
    getEthereumValidatorsQueue: typeof getEthereumValidatorsQueue;
};

export const fetchEthereumEverstakePooledProductInfo = async (
    deps: EthereumEverstakePooledProductInfoDeps,
    { abortSignal }: FetchProductInfoParams,
): Promise<StakingProductInfo> => {
    // The staking API knows mainnet only, so Hoodi reads the same numbers.
    const [stats, queue] = await Promise.all([
        deps.getStakingStats({ routeParams: { networkSymbol: 'eth' }, signal: abortSignal }),
        deps.getEthereumValidatorsQueue({ signal: abortSignal }).catch(() => null),
    ]);

    if (stats.symbol !== 'eth') {
        throw new Error(`Expected eth staking stats, received ${stats.symbol}`);
    }

    const rate = stats.apy;

    const entryDays = getPeriodDays(queue?.addingDelay, queue?.activationTime);
    const entryPeriodDays = entryDays === null ? null : Math.max(1, entryDays);
    const exitPeriodDays = getPeriodDays(queue?.withdrawTime, queue?.exitTime);

    const nextRewardAt =
        stats.nextRewardPayout > 0 ? getNextRewardAt(stats.nextRewardPayout) : null;

    return stakingProductInfoSchema.parse({
        rate,
        entryPeriodDays,
        exitPeriodDays,
        rewardPeriodDays: null,
        nextRewardAt,
        targets: [],
    });
};
