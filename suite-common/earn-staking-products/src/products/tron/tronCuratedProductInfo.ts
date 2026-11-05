import type { getTronStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

import type { TronRepresentative } from './tronRepresentatives';

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

    const targets = stats.flatMap(({ address, name, apr }) => {
        const representative = representatives.find(candidate => candidate.address === address);

        if (representative === undefined) {
            return [];
        }

        const rate = apr;
        const providerId = representative.provider.id;

        return [{ address, providerId, name, rate, saturation: null }];
    });

    return stakingProductInfoSchema.parse({
        rate: targets.length === 0 ? null : Math.max(...targets.map(({ rate }) => rate)),
        entryPeriodDays: null,
        exitPeriodDays: TRON_UNFREEZE_DELAY_DAYS,
        nextRewardAt: null,
        targets,
    });
};
