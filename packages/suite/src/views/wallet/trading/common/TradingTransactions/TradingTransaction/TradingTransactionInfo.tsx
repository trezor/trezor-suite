import type { TradingTransaction, TradingType } from '@suite-common/trading';
import { InfoSegments } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedDate } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { TradingTransactionStatus } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionStatus';

interface TradingTransactionInfoProps {
    trade: TradingTransaction;
}

const translationKeys: Record<
    TradingType,
    Extract<ExtendedMessageDescriptor['id'], 'TR_BUY' | 'TR_TRADING_SELL' | 'TR_TRADING_SWAP'>
> = {
    buy: 'TR_BUY',
    sell: 'TR_TRADING_SELL',
    exchange: 'TR_TRADING_SWAP',
};

export const TradingTransactionInfo = ({ trade }: TradingTransactionInfoProps) => {
    const { date } = trade;
    const { translationString } = useTranslation();
    const tradeType = translationString(translationKeys[trade.tradeType]).toUpperCase();

    return (
        <InfoSegments
            data-testid="@trading/transactions/info"
            variant="tertiary"
            typographyStyle="label"
            margin={{ top: spacings.xs }}
        >
            {tradeType}
            <FormattedDate value={date} date time />
            <TradingTransactionStatus trade={trade} />
        </InfoSegments>
    );
};
