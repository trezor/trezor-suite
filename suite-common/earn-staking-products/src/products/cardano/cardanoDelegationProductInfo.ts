import type { getCardanoPools } from '@suite-common/earn-staking-api';
import {
    type FetchProductInfoParams,
    type StakingProductInfo,
    type StakingProvider,
    stakingProductInfoSchema,
} from '@suite-common/earn-staking-common';

// Copied from wallet-constants; unstaking is immediate on chain, the legacy period is kept.
export const CARDANO_EPOCH_DAYS = 5;

export const CARDANO_UNMANAGED_DELEGATION_PRODUCT_INFO = stakingProductInfoSchema.parse({
    rate: null,
    entryPeriodDays: null,
    exitPeriodDays: CARDANO_EPOCH_DAYS,
    nextRewardAt: null,
    targets: [],
});

export type CardanoDelegationProductInfoDeps = {
    getCardanoPools: typeof getCardanoPools;
};

export type FetchCardanoDelegationProductInfoParams = FetchProductInfoParams & {
    provider: StakingProvider;
    poolIds: readonly string[];
};

export const fetchCardanoDelegationProductInfo = async (
    deps: CardanoDelegationProductInfoDeps,
    { abortSignal, provider, poolIds }: FetchCardanoDelegationProductInfoParams,
): Promise<StakingProductInfo> => {
    const { pools } = await deps.getCardanoPools({ signal: abortSignal });

    const targets = pools
        .filter(({ id }) => poolIds.includes(id))
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
