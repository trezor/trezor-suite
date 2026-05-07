import { Translation } from '@suite/intl';
import { BulletList } from '@trezor/components';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';

import { EarnInfoRow } from './EarnInfoRow';

interface YieldSupplyingInfoProps {
    apy: number | null;
}

export const YieldSupplyingInfo = ({ apy }: YieldSupplyingInfoProps) => (
    <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
        <EarnInfoRow
            heading={<Translation id="TR_EARN_YIELD_APPROVE_SPENDING_TRANSACTION" />}
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        <EarnInfoRow
            heading={<Translation id="TR_EARN_SIGN_SUPPLYING_TRANSACTION" />}
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        {apy !== null && (
            <EarnInfoRow
                heading={<Translation id="TR_EARN_YIELD_EARN_REWARDS_EACH_BLOCK" />}
                content={{
                    text: (
                        <Translation
                            id="TR_EARN_APY_APPROX"
                            values={{ apyPercent: formatApyValue(apy) }}
                        />
                    ),
                }}
            />
        )}
    </BulletList>
);
