import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { InfoItem } from '@trezor/components';

import { type Account } from 'src/types/wallet';
import { TradingDetailTxId } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailTxId';

type TradingDetailTransactionIdRowProps = {
    txId?: string;
    account?: Account;
    receiveAccountKey?: AccountKey;
};

export const TradingDetailTransactionIdRow = ({
    txId,
    account,
    receiveAccountKey,
}: TradingDetailTransactionIdRowProps) => {
    if (!txId || !account) {
        return null;
    }

    return (
        <InfoItem label={<Translation id="TR_TRADING_DETAIL_TRANSACTION_ID" />} direction="row">
            <TradingDetailTxId
                value={txId}
                account={account}
                receiveAccountKey={receiveAccountKey}
            />
        </InfoItem>
    );
};
