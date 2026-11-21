import { Translation } from '@suite/intl';
import { useStakingActivationDays } from '@suite-common/earn';
import {
    useStakingAccountPosition,
    useStakingDaysUntil,
    useStakingPeriods,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Paragraph, Skeleton } from '@trezor/components';

import { PayoutCard } from './PayoutCard';

interface PayoutCardNextRewardsProps {
    account: Account;
}

export const PayoutCardNextRewards = ({ account }: PayoutCardNextRewardsProps) => {
    const { productId, totals } = useStakingAccountPosition(account.key);
    const { nextRewardAt } = useStakingPeriods(productId);

    const nextRewardInDays = useStakingDaysUntil(nextRewardAt);
    const daysUntilActivation = useStakingActivationDays(account.key);
    const hasStake = isPositiveBalance(totals.staked);

    const getPayoutInDays = () => {
        if (nextRewardInDays === null) return null;

        // Nothing earns before the first activation, so a payout before it waits for the next.
        if (hasStake || daysUntilActivation === null || daysUntilActivation <= nextRewardInDays) {
            return nextRewardInDays;
        }

        return daysUntilActivation + nextRewardInDays;
    };

    const payoutInDays = getPayoutInDays();

    return (
        <PayoutCard>
            <>
                {payoutInDays === null ? (
                    <Skeleton width={80} height={32} animate />
                ) : (
                    <Paragraph typographyStyle="headline-md">
                        <Translation id="TR_STAKE_DAYS" values={{ count: payoutInDays }} />
                    </Paragraph>
                )}
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_STAKE_NEXT_PAYOUT" />
                </Paragraph>
            </>
        </PayoutCard>
    );
};
