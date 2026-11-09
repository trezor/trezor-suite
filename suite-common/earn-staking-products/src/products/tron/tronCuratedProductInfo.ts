import type { getTronStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

import { type TronRepresentative } from './types';

// Copied from wallet-core tronStakingConstants.ts.
export const TRON_UNFREEZE_DELAY_DAYS = 14;

export type TronCuratedProductInfoDeps = {
    getTronStakingStats: typeof getTronStakingStats;
};

export type FetchTronCuratedProductInfoParams = FetchProductInfoParams & {
    representatives: readonly TronRepresentative[];
};

export const fetchTronCuratedProductInfo = async (
    deps: TronCuratedProductInfoDeps,
    { abortSignal, representatives }: FetchTronCuratedProductInfoParams,
): Promise<StakingProductInfo> => {
    const stats = await deps.getTronStakingStats({ signal: abortSignal });

    const targets = stats
        .filter(({ address }, index) => stats.findIndex(sr => sr.address === address) === index)
        .flatMap(({ address, apr }) => {
            const provider = representatives.find(
                candidate => candidate.address === address,
            )?.provider;

            if (provider === undefined) {
                return [];
            }

            return [
                {
                    address,
                    providerId: provider.id,
                    name: provider.name,
                    rate: apr,
                    saturation: null,
                },
            ];
        });

    return stakingProductInfoSchema.parse({
        rate: targets.length === 0 ? null : Math.max(...targets.map(({ rate }) => rate)),
        entryPeriodDays: null,
        exitPeriodDays: TRON_UNFREEZE_DELAY_DAYS,
        nextRewardAt: null,
        targets,
    });
};
