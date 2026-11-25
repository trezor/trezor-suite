import { Translation } from '@suite/intl';
import { useStakingActivationDays } from '@suite-common/earn';
import {
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
    const { nextRewardAt } = useStakingPeriods(productId);

    const nextRewardInDays = useStakingDaysUntil(nextRewardAt);
    const daysUntilActivation = useStakingActivationDays(account.key);
    const hasStake = isPositiveBalance(totals.staked);

    const getPayoutInDays = (): number | null => {
        if (nextRewardInDays === null) return null;

        if (hasStake) return nextRewardInDays;

        // Nothing earns before the first activation: a payout before it waits for the next one,
        // and an activation that cannot be dated dates no payout.
        if (daysUntilActivation === null) return null;

        return daysUntilActivation <= nextRewardInDays
            ? nextRewardInDays
            : daysUntilActivation + nextRewardInDays;
    };

    return (
        <PayoutCard
            days={getPayoutInDays()}
            isPending={isPending}
            label={<Translation id="TR_STAKE_NEXT_PAYOUT" />}
        />
    );
};
