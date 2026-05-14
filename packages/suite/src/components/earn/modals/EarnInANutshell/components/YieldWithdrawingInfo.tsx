import { Translation } from '@suite/intl';
import { BulletList } from '@trezor/components';

import { EarnInfoRow } from './EarnInfoRow';

interface YieldWithdrawingInfoProps {
    supplySymbol: string;
}

export const YieldWithdrawingInfo = ({ supplySymbol }: YieldWithdrawingInfoProps) => (
    <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
        <EarnInfoRow
            heading={<Translation id="TR_EARN_SIGN_WITHDRAWAL_TRANSACTION" />}
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        <EarnInfoRow
            heading={
                <Translation id="TR_EARN_YIELD_RECEIVE_IN_ACCOUNT" values={{ supplySymbol }} />
            }
            content={{ text: <Translation id="TR_EARN_INSTANTLY" /> }}
        />
    </BulletList>
);
