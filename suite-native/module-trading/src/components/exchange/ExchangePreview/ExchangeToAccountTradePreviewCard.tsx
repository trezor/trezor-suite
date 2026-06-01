import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeSideCard } from '@suite-native/trading-atoms';
import {
    CryptoToFiatValueBadge,
    useChangeStringsExtractor,
} from '@suite-native/trading-quote-utils';
import { selectExchangeSelectedReceiveAccount } from '@suite-native/trading-state';

export type ExchangeToAccountTradePreviewCardProps = {
    quote?: ExchangeTrade;
};

export const ExchangeToAccountTradePreviewCard = ({
    quote,
}: ExchangeToAccountTradePreviewCardProps) => {
    const toAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const { toStringValue, toValue } = useChangeStringsExtractor(quote);

    if (!quote?.receive || !toAccount?.account) {
        return null;
    }

    return (
        <TradeSideCard
            account={toAccount.account}
            cryptoId={quote.receive}
            amount={
                !!toStringValue && (
                    <Text variant="body-sm" color="contentBrand">
                        +{toStringValue}
                    </Text>
                )
            }
            title={<Translation id="moduleTrading.tradingExchangePreviewScreen.toAccount" />}
        >
            {!!toValue && (
                <CryptoToFiatValueBadge
                    amount={toValue}
                    cryptoId={quote.receive}
                    color="contentSecondary"
                    textAlign="right"
                />
            )}
        </TradeSideCard>
    );
};
