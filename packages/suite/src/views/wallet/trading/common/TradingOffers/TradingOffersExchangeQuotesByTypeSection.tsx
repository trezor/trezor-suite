import { ExchangeTrade } from 'invity-api';

import { H3, Icon, Row, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ExtendedMessageDescriptor, Translation } from 'src/components/suite/Translation';
import { TradingOffersItem } from 'src/views/wallet/trading/common/TradingOffers/TradingOffersItem';

interface TradingOffersExchangeQuotesByTypeSectionProps {
    quotes: ExchangeTrade[];
    heading: ExtendedMessageDescriptor['id'];
    tooltip: ExtendedMessageDescriptor['id'];
}

export const TradingOffersExchangeQuotesByTypeSection = ({
    quotes,
    heading,
    tooltip,
}: TradingOffersExchangeQuotesByTypeSectionProps) => {
    if (quotes.length === 0) return null;

    return (
        <>
            <Row
                alignItems="center"
                gap={spacings.xs}
                margin={{ top: spacings.xxxxl, bottom: spacings.xxs }}
            >
                <Tooltip content={<Translation id={tooltip} />}>
                    <H3>
                        <Translation id={heading} />
                    </H3>
                    <Icon name="info" variant="tertiary" size={20} />
                </Tooltip>
            </Row>
            {quotes.map(quote => (
                <TradingOffersItem key={quote.orderId} quote={quote} isBestRate={false} />
            ))}
        </>
    );
};
