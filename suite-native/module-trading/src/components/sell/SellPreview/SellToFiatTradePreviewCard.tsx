import type { SellFiatTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useChangeStringsExtractor } from '../../../hooks/history/useChangeStringsExtractor';
import { TradeFiatSideCard } from '../../general/TradeInfo/TradeFiatSideCard';

export type SellToFiatTradePreviewCardProps = {
    quote?: SellFiatTrade;
};

export const SellToFiatTradePreviewCard = ({ quote }: SellToFiatTradePreviewCardProps) => {
    const { toStringValue } = useChangeStringsExtractor(quote);

    if (!quote || !quote.paymentMethod || !quote.fiatCurrency || !toStringValue) {
        return null;
    }

    return (
        <TradeFiatSideCard
            paymentMethod={quote.paymentMethod}
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
