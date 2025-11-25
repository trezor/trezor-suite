import { Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

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
            <Paragraph typographyStyle="hint" variant="tertiary">
                <Translation id="TR_STAKE_NEXT_PAYOUT_FREQUENCY" />
            </Paragraph>
        </>
    </PayoutCard>
);
