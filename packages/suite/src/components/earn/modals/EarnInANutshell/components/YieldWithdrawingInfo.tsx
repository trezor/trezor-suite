import { Translation } from '@suite/intl';
import { BulletList } from '@trezor/components';

import { EarnInfoRow } from './EarnInfoRow';

interface YieldWithdrawingInfoProps {
    depositSymbol: string;
}

export const YieldWithdrawingInfo = ({ depositSymbol }: YieldWithdrawingInfoProps) => (
    <BulletList bulletGap={12} gap={16} bulletSize="small" titleGap={2}>
        <EarnInfoRow
            heading={<Translation id="TR_EARN_SIGN_WITHDRAWAL_TRANSACTION" />}
            subheading={
                <Translation
                    id="TR_EARN_YIELD_WITHDRAW_USES_VAULT_TOKENS_SUB"
                    values={{ supplySymbol: depositSymbol }}
                />
            }
            content={{ text: <Translation id="TR_TRADING_NETWORK_FEE" />, isBadge: true }}
        />
        <EarnInfoRow
            heading={
                <Translation
                    id="TR_EARN_YIELD_RECEIVE_IN_ACCOUNT"
                    values={{ supplySymbol: depositSymbol }}
                />
            }
            content={{ text: <Translation id="TR_EARN_INSTANTLY" /> }}
        />
    </BulletList>
);
