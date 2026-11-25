import type {
    EthValidatorsQueue,
    getEthereumValidatorsQueue,
    getStakingStats,
} from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

const SECONDS_IN_DAY = 24 * 60 * 60;

// Exact, so a period end is not rounded twice: here and again where the days left are shown. The
// entry period needs both of its parts; the exit period needs the withdraw time and adds the exit
// time when the queue reports it, as the legacy helpers read them.
const getEntryPeriodDays = (queue: EthValidatorsQueue | null): number | null =>
    queue?.addingDelay === undefined || queue.activationTime === undefined
        ? null
        : (queue.addingDelay + queue.activationTime) / SECONDS_IN_DAY;

const getExitPeriodDays = (queue: EthValidatorsQueue | null): number | null =>
    queue?.withdrawTime === undefined
        ? null
        : (queue.withdrawTime + (queue.exitTime ?? 0)) / SECONDS_IN_DAY;

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

export type FetchEthereumEverstakePooledProductInfoParams = FetchProductInfoParams & {
    networkSymbol: NetworkSymbol;
};

export const fetchEthereumEverstakePooledProductInfo = async (
    deps: EthereumEverstakePooledProductInfoDeps,
    { networkSymbol, abortSignal }: FetchEthereumEverstakePooledProductInfoParams,
): Promise<StakingProductInfo> => {
    // The staking API knows mainnet only, so Hoodi reads the same periods.
    const [stats, queue] = await Promise.all([
        deps.getStakingStats({ routeParams: { networkSymbol: 'eth' }, signal: abortSignal }),
        deps.getEthereumValidatorsQueue({ signal: abortSignal }).catch(() => null),
    ]);

    if (stats.symbol !== 'eth') {
        throw new Error(`Expected eth staking stats, received ${stats.symbol}`);
    }

    // The stats rate the network they name; a product on another network, Hoodi, takes no rate, as
    // the legacy selectors left it.
    const rate = networkSymbol === asNetworkSymbol(stats.symbol) ? stats.apy : null;

    const entryPeriodDays = getEntryPeriodDays(queue);
    const exitPeriodDays = getExitPeriodDays(queue);

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
