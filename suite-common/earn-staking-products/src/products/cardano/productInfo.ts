import {
    type getCardanoPools,
    stakingCardanoPoolsQueryLimitMax,
} from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    type StakingProvider,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

import { CARDANO_EPOCH_DAYS } from './constants';

export const CARDANO_UNMANAGED_PRODUCT_INFO = stakingProductInfoSchema.parse({
    rate: null,
    entryPeriodDays: null,
    exitPeriodDays: CARDANO_EPOCH_DAYS,
    nextRewardAt: null,
    targets: [],
});

export type CardanoProductInfoDeps = {
    getCardanoPools: typeof getCardanoPools;
};

export type FetchCardanoProductInfoParams = FetchProductInfoParams & {
    provider: StakingProvider;
    poolIds: readonly string[];
};

export const fetchCardanoProductInfo = async (
    deps: CardanoProductInfoDeps,
    { abortSignal, provider, poolIds }: FetchCardanoProductInfoParams,
): Promise<StakingProductInfo> => {
    // The endpoint returns ten pools by default, most saturated first, which would cut off the
    // least saturated pool Suite promotes.
    const { pools } = await deps.getCardanoPools({
        signal: abortSignal,
        params: { limit: stakingCardanoPoolsQueryLimitMax },
    });

    const targets = pools
        .map(pool => ({ ...pool, id: pool.id.toLowerCase() }))
        .filter(({ id }) => poolIds.includes(id))
        .filter(({ id }, index, ownPools) => ownPools.findIndex(pool => pool.id === id) === index)
        .map(({ id, apy, saturation }) => ({
            address: id,
            providerId: provider.id,
            name: provider.name,
            rate: apy,
            saturation,
        }));

    // New stake goes to the least saturated pool, so its APY is the one Suite promotes.
    const [leastSaturatedTarget] = targets.toSorted((a, b) => a.saturation - b.saturation);

    return stakingProductInfoSchema.parse({
        rate: leastSaturatedTarget?.rate ?? null,
        entryPeriodDays: null,
        exitPeriodDays: CARDANO_EPOCH_DAYS,
        nextRewardAt: null,
        targets,
    });
};
