import { ExchangeTrade } from 'invity-api';
import { ExtendedMessageDescriptor, Translation } from 'src/components/suite/Translation';
import { H3, Icon, Row, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { CoinmarketOffersItem } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffersItem';

interface CoinmarketOffersExchangeQuotesByTypeSectionProps {
    quotes: ExchangeTrade[];
    heading: ExtendedMessageDescriptor['id'];
    tooltip: ExtendedMessageDescriptor['id'];
}

export const CoinmarketOffersExchangeQuotesByTypeSection = ({
    quotes,
    heading,
    tooltip,
}: CoinmarketOffersExchangeQuotesByTypeSectionProps) => {
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
                <CoinmarketOffersItem key={quote.orderId} quote={quote} isBestRate={false} />
            ))}
        </>
    );
};
