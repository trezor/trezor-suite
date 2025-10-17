import type { SellFiatTrade } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TradeFiatSideCard } from '../../general/TradeFiatSideCard';

export type SellToFiatTradePreviewCardProps = {
    quote?: SellFiatTrade;
    toStringValue: string | undefined;
};

export const SellToFiatTradePreviewCard = ({
    quote,
    toStringValue,
}: SellToFiatTradePreviewCardProps) => {
    if (!quote?.fiatCurrency || !quote.paymentMethod) {
        return null;
    }

    return (
        <TradeFiatSideCard
            paymentMethod={quote.paymentMethod}
            amount={
                !!toStringValue && (
                    <Text variant="hint" color="textSecondaryHighlight">
                        +{toStringValue}
                    </Text>
                )
            }
            title={<Translation id="moduleTrading.tradingSellPreviewScreen.toFiat" />}
        />
    );
};
