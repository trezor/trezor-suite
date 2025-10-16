import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangeTradePreviewCard } from './ExchangeTradePreviewCard';
import { selectExchangeSelectedSendAccount } from '../../../selectors/exchangeSelectors';

export type ExchangeFromAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
    fromStringValue: string | undefined;
};

export const ExchangeFromAccountTradePreviewCard = ({
    quote,
    fromStringValue,
}: ExchangeFromAccountTradePreviewCardProps) => {
    const fromAccount = useSelector(selectExchangeSelectedSendAccount);

    if (!quote?.send || !fromAccount) {
        return null;
    }

    return (
        <ExchangeTradePreviewCard
            account={fromAccount}
            cryptoId={quote.send}
            amount={
                <Text variant="hint" color="textAlertRed">
                    -{fromStringValue}
                </Text>
            }
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.fromAccount" />}
        />
    );
};
