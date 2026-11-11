import type { getTronStakingStats } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

import { TRON_UNFREEZE_DELAY_DAYS } from './constants';
import { type TronSuperRepresentative } from './types';

export type TronNativeProductInfoDeps = {
    getTronStakingStats: typeof getTronStakingStats;
};

export type FetchTronNativeProductInfoParams = FetchProductInfoParams & {
    superRepresentatives: readonly TronSuperRepresentative[];
};

export const fetchTronNativeProductInfo = async (
    deps: TronNativeProductInfoDeps,
    { abortSignal, superRepresentatives }: FetchTronNativeProductInfoParams,
): Promise<StakingProductInfo> => {
    const stats = await deps.getTronStakingStats({ signal: abortSignal });

    const targets = stats
        .filter(({ address }, index) => stats.findIndex(sr => sr.address === address) === index)
        .flatMap(({ address, apr }) => {
            const provider = superRepresentatives.find(
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
