import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { selectExchangeSelectedReceiveAccount } from '../../../selectors/exchangeSelectors';
import { TradeSideCard } from '../../general/TradeSideCard';

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
        <TradeSideCard
            account={toAccount.account}
            cryptoId={quote.receive}
            amount={
                !!toStringValue && (
                    <Text variant="hint" color="textSecondaryHighlight">
                        +{toStringValue}
                    </Text>
                )
            }
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.toAccount" />}
        />
    );
};
