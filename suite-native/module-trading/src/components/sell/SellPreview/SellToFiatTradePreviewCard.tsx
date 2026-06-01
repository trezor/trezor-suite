import type { FiatCurrencyCode, SellFiatTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useChangeStringsExtractor } from '@suite-native/trading-quote-utils';

import { TradeFiatSideCard } from '../../general/TradeInfo/TradeFiatSideCard';

export type SellToFiatTradePreviewCardProps = {
    quote?: SellFiatTrade;
};

export const SellToFiatTradePreviewCard = ({ quote }: SellToFiatTradePreviewCardProps) => {
    const { toStringValue } = useChangeStringsExtractor(quote);

    if (!quote?.paymentMethod || !quote.fiatCurrency || !toStringValue) {
        return null;
    }

    return (
        <TradeFiatSideCard
            fiatCurrency={quote.fiatCurrency as FiatCurrencyCode}
            paymentMethod={quote.paymentMethod}
            paymentMethodName={quote.paymentMethodName}
            amount={
                !!toStringValue && (
                    <Text variant="body-sm" color="contentBrand">
                        +{toStringValue}
                    </Text>
                )
            }
            title={<Translation id="moduleTrading.tradingSellPreviewScreen.toFiat" />}
        />
    );
};
