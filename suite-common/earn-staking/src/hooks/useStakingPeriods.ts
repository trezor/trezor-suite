import type { StakingProductId } from '@suite-common/earn-staking-common';

import { useStakingProductInfo } from './useStakingProductInfo';

export type StakingPeriods = {
    entryPeriodDays: number | null;
    exitPeriodDays: number | null;
    rewardPeriodDays: number | null;
    nextRewardAt: number | null;
};

const toWholeDays = (days: number | null) => (days === null ? null : Math.round(days));

export const useStakingPeriods = (productId: StakingProductId | null): StakingPeriods => {
    const { productInfo } = useStakingProductInfo(productId);

    const entryDays = toWholeDays(productInfo?.entryPeriodDays ?? null);
    const entryPeriodDays = entryDays === null ? null : Math.max(1, entryDays);
    const exitPeriodDays = toWholeDays(productInfo?.exitPeriodDays ?? null);
    const rewardPeriodDays = productInfo?.rewardPeriodDays ?? null;
    const nextRewardAt = productInfo?.nextRewardAt ?? null;

    return { entryPeriodDays, exitPeriodDays, rewardPeriodDays, nextRewardAt };
};
