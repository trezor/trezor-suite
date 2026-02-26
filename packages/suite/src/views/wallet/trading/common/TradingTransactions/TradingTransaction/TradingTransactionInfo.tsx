import { useTranslation } from '@suite/intl';
import type { TradingTransaction } from '@suite-common/trading';
import { InfoSegments } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedDate } from 'src/components/suite';
import { translationKeys } from 'src/utils/wallet/trading/tradingUtils';
import { TradingTransactionStatus } from 'src/views/wallet/trading/common/TradingTransactions/TradingTransaction/TradingTransactionStatus';

interface TradingTransactionInfoProps {
    trade: TradingTransaction;
}

export const TradingTransactionInfo = ({ trade }: TradingTransactionInfoProps) => {
    const { date } = trade;
    const { translationString } = useTranslation();
    const tradeType = translationString(translationKeys[trade.tradeType]).toUpperCase();

    return (
        <InfoSegments
            data-testid="@trading/transactions/info"
            intent="neutral"
            priority="secondary"
            typographyStyle="body-xs"
            margin={{ top: spacings.xs }}
        >
            {tradeType}
            <span data-testid="@trading/transactions/date">
                <FormattedDate value={date} date time />
            </span>
            <TradingTransactionStatus trade={trade} />
        </InfoSegments>
    );
};
