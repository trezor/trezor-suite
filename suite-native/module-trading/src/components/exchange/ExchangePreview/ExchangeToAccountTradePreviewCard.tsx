import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangeTradePreviewCard } from './ExchangeTradePreviewCard';
import { selectExchangeSelectedReceiveAccount } from '../../../selectors/exchangeSelectors';

export type ExchangeToAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
    toStringValue: string | undefined;
};

export const ExchangeToAccountTradePreviewCard = ({
    quote,
    toStringValue,
}: ExchangeToAccountTradePreviewCardProps) => {
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);

    if (!quote?.receive || !toAccount?.account) {
        return null;
    }

    return (
        <ExchangeTradePreviewCard
            account={toAccount.account}
            cryptoId={quote.receive}
            amount={
                <Text variant="hint" color="textSecondaryHighlight">
                    +{toStringValue}
                </Text>
            }
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.toAccount" />}
        />
    );
};
