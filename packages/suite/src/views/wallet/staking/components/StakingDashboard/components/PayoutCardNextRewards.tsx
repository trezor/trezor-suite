import { Translation } from '@suite/intl';
import { useStakingActivationDays } from '@suite-common/earn';
import {
    getStakingNextPayoutInDays,
    useStakingAccountPosition,
    useStakingDaysUntil,
    useStakingPeriods,
    useStakingProductInfo,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';

import { PayoutCard } from './PayoutCard';

interface PayoutCardNextRewardsProps {
    account: Account;
}

export const PayoutCardNextRewards = ({ account }: PayoutCardNextRewardsProps) => {
    const { productId, totals } = useStakingAccountPosition(account.key);
    const { isPending } = useStakingProductInfo(productId);
    const { nextRewardAt, rewardPeriodDays } = useStakingPeriods(productId);

    const nextRewardInDays = useStakingDaysUntil(nextRewardAt);
    const daysUntilActivation = useStakingActivationDays(account.key);

    const days = getStakingNextPayoutInDays({
        nextRewardInDays,
        daysUntilActivation,
        rewardPeriodDays,
        hasStake: isPositiveBalance(totals.staked),
    });

    return (
        <PayoutCard
            days={days}
            isPending={isPending}
            label={<Translation id="TR_STAKE_NEXT_PAYOUT" />}
        />
    );
};
