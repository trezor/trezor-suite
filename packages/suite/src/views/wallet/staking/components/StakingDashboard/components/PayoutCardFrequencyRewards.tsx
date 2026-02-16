import { Translation } from '@suite/intl';
import { Paragraph } from '@trezor/components';

import { PayoutCard } from './PayoutCard';

interface PayoutCardFrequencyRewardsProps {
    rewardFrequency: number;
}

export const PayoutCardFrequencyRewards = ({
    rewardFrequency,
}: PayoutCardFrequencyRewardsProps) => (
    <PayoutCard>
        <>
            <Paragraph typographyStyle="titleMedium">
                <Translation id="TR_STAKE_DAYS" values={{ count: rewardFrequency }} />
            </Paragraph>
            <Paragraph typographyStyle="hint" intent="neutral" priority="secondary">
                <Translation id="TR_STAKE_NEXT_PAYOUT_FREQUENCY" />
            </Paragraph>
        </>
    </PayoutCard>
);
