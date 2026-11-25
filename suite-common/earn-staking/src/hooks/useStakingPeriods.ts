import type { StakingProductId } from '@suite-common/earn-staking-common';

import { useStakingProductInfo } from './useStakingProductInfo';

export type StakingPeriods = {
    entryPeriodDays: number | null;
    exitPeriodDays: number | null;
    rewardPeriodDays: number | null;
    nextRewardAt: number | null;
};

// A period shows at least one day, as the legacy helpers did.
const toWholeDays = (days: number | null) => (days === null ? null : Math.max(1, Math.round(days)));

export const useStakingPeriods = (productId: StakingProductId | null): StakingPeriods => {
    const { productInfo } = useStakingProductInfo(productId);

    const entryPeriodDays = toWholeDays(productInfo?.entryPeriodDays ?? null);
    const exitPeriodDays = toWholeDays(productInfo?.exitPeriodDays ?? null);
    const rewardPeriodDays = productInfo?.rewardPeriodDays ?? null;
    const nextRewardAt = productInfo?.nextRewardAt ?? null;

    return { entryPeriodDays, exitPeriodDays, rewardPeriodDays, nextRewardAt };
};
