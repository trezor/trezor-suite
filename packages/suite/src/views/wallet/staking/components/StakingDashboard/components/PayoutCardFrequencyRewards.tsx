import { Translation } from '@suite/intl';
import { Paragraph, Skeleton } from '@trezor/components';

import { PayoutCard } from './PayoutCard';

interface PayoutCardFrequencyRewardsProps {
    rewardFrequency: number | null;
}

export const PayoutCardFrequencyRewards = ({
    rewardFrequency,
}: PayoutCardFrequencyRewardsProps) => (
    <PayoutCard>
        <>
            {rewardFrequency === null ? (
                <Skeleton width={80} height={32} animate />
            ) : (
                <Paragraph typographyStyle="headline-md">
                    <Translation id="TR_STAKE_DAYS" values={{ count: rewardFrequency }} />
                </Paragraph>
            )}
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_STAKE_NEXT_PAYOUT_FREQUENCY" />
            </Paragraph>
        </>
    </PayoutCard>
);
