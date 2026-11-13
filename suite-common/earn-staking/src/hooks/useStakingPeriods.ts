import type { StakingProductId } from '@suite-common/earn-staking-common';

import { useStakingProductInfo } from './useStakingProductInfo';

export type StakingPeriods = {
    entryPeriodDays: number | null;
    exitPeriodDays: number | null;
    rewardPeriodDays: number | null;
    nextRewardAt: number | null;
};

export const useStakingPeriods = (productId: StakingProductId): StakingPeriods => {
    const { productInfo } = useStakingProductInfo(productId);

    const entryPeriodDays = productInfo?.entryPeriodDays ?? null;
    const exitPeriodDays = productInfo?.exitPeriodDays ?? null;
    const rewardPeriodDays = productInfo?.rewardPeriodDays ?? null;
    const nextRewardAt = productInfo?.nextRewardAt ?? null;

    return { entryPeriodDays, exitPeriodDays, rewardPeriodDays, nextRewardAt };
};
