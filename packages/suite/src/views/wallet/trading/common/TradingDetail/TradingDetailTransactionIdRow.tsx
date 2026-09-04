import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { InfoItem, type TextProps } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailTxId } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTxId';

type TradingDetailTransactionIdRowProps = {
    txId?: string;
    account?: Account;
    receiveAccountKey?: AccountKey;
    priority?: TextProps['priority'];
};

export const TradingDetailTransactionIdRow = ({
    txId,
    account,
    receiveAccountKey,
    priority,
}: TradingDetailTransactionIdRowProps) => {
    if (!txId || !account) {
        return null;
    }

    return (
        <InfoItem label={<Translation id="TR_TRADING_DETAIL_TRANSACTION_ID" />} direction="row">
            <TradingDetailTxId
                intent="neutral"
                priority={priority}
                value={txId}
                account={account}
                receiveAccountKey={receiveAccountKey}
            />
        </InfoItem>
    );
};
