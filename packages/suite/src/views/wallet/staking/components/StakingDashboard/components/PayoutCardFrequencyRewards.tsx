import { Translation } from '@suite/intl';
import { useStakingPeriods, useStakingProductInfo } from '@suite-common/earn-staking';
import { type StakingProductId } from '@suite-common/earn-staking-common';

import { PayoutCard } from './PayoutCard';

interface PayoutCardFrequencyRewardsProps {
    productId: StakingProductId | null;
}

export const PayoutCardFrequencyRewards = ({ productId }: PayoutCardFrequencyRewardsProps) => {
    const { isPending } = useStakingProductInfo(productId);
    const { rewardPeriodDays } = useStakingPeriods(productId);

    return (
        <PayoutCard
            days={rewardPeriodDays}
            isPending={isPending}
            label={<Translation id="TR_STAKE_NEXT_PAYOUT_FREQUENCY" />}
        />
    );
};
