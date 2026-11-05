import type { getEthereumValidatorsQueue, getStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

const getPeriodDays = (firstSeconds?: number, secondSeconds?: number): number | null => {
    if (firstSeconds === undefined || secondSeconds === undefined) return null;

    const secondsInDay = 24 * 60 * 60;

    return Math.max(1, Math.round((firstSeconds + secondSeconds) / secondsInDay));
};

const getNextRewardAt = (nextRewardPayout: number): number => {
    const nextRewardPayoutMs = nextRewardPayout * 1000;

    return Date.now() + Math.round(nextRewardPayoutMs);
};

export type EverstakePooledProductInfoDeps = {
    getStakingStats: typeof getStakingStats;
    getEthereumValidatorsQueue: typeof getEthereumValidatorsQueue;
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

    const rate = stats.apy;

    const entryPeriodDays = getPeriodDays(queue.addingDelay, queue.activationTime);
    const exitPeriodDays = getPeriodDays(queue.withdrawTime, queue.exitTime);

    const nextRewardAt = stats.symbol === 'eth' ? getNextRewardAt(stats.nextRewardPayout) : null;

    return stakingProductInfoSchema.parse({
        rate,
        entryPeriodDays,
        exitPeriodDays,
        nextRewardAt,
        targets: [],
    });
};
