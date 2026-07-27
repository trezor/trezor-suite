import { FormattedList } from 'react-intl';

import { Translation } from '@suite/intl';
import { StepList } from '@trezor/components';

import { EarnInfoRow } from './EarnInfoRow';

interface YieldClaimingInfoProps {
    rewardsSymbols: string[];
}

export const YieldClaimingInfo = ({ rewardsSymbols }: YieldClaimingInfoProps) => (
    <StepList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
        <EarnInfoRow
            heading={<Translation id="TR_EARN_SIGN_CLAIM_REWARDS_TRANSACTION" />}
            subheading={<Translation id="TR_EARN_YIELD_CLAIM_AVAILABLE_IN_EARN_SUB" />}
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_YIELD_RECEIVE_REWARDS_IN_ACCOUNT"
                    values={{
                        rewardsSymbols: <FormattedList type="conjunction" value={rewardsSymbols} />,
                    }}
                />
            }
            content={{ text: <Translation id="TR_EARN_INSTANTLY" /> }}
        />
    </StepList>
);
